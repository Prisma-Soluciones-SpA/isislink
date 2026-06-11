const https = require('https');

const SOAP_URL = 'https://www.prismasoluciones.cl/isis/WsPrisma/controlador/wsPortal/ws_wsPortal.php';

let _token = null;
let _tokenExpiry = 0;

function soapPost(body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SOAP_URL);
    const buf = Buffer.from(body, 'utf8');
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '""',
        'Content-Length': buf.length
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function extractAll(xml, tag) {
  return xml.match(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi')) || [];
}

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ws_wsPortal">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:chkLogin soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
      <email xsi:type="xsd:string">${process.env.SOAP_EMAIL}</email>
      <clave xsi:type="xsd:string">${process.env.SOAP_CLAVE}</clave>
    </urn:chkLogin>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await soapPost(body);
  const token = extractTag(xml, 'tok_sesion');
  if (!token) throw new Error('SOAP login fallido');

  _token = token;
  _tokenExpiry = Date.now() + 3_600_000; // 1 hora
  return token;
}

async function getConsejos() {
  const token = await getToken();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ws_wsPortal">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:traeConsejos soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
      <token xsi:type="xsd:string">${token}</token>
      <email xsi:type="xsd:string">${process.env.SOAP_EMAIL}</email>
      <flg xsi:type="xsd:string">1</flg>
    </urn:traeConsejos>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await soapPost(body);
  const status = extractTag(xml, 'status');

  if (status !== 'true') {
    _token = null; // forzar re-login la próxima vez
    throw new Error('traeConsejos falló');
  }

  return extractAll(xml, 'CONSEJO').map(block => ({
    id: extractTag(block, 'id_consejo'),
    title: extractTag(block, 'gls_titulo'),
    description: extractTag(block, 'gls_consejo'),
    imageUrl: extractTag(block, 'gls_imagen'),
    videoUrl: extractTag(block, 'gls_video'),
    isActive: extractTag(block, 'flg_activo') === '1'
  }));
}

module.exports = { getConsejos };
