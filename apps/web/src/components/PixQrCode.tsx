import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface PixQrCodeProps {
  pixKey: string;
  beneficiary?: string;
  city?: string;
  amount?: number;
  size?: number;
}

const CITY_MAX = 15;
const NAME_MAX = 25;

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function emvField(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function buildPixPayload({ pixKey, beneficiary, city, amount }: PixQrCodeProps) {
  const gui = emvField("00", "br.gov.bcb.pix");
  const keyField = emvField("01", pixKey);
  const merchantAccount = emvField("26", gui + keyField);
  const payload = emvField("00", "01");
  const merchantCategory = emvField("52", "0000");
  const currency = emvField("53", "986");
  const country = emvField("58", "BR");
  const name = emvField("59", (beneficiary || "RECEBEDOR").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, NAME_MAX));
  const cityField = emvField("60", (city || "BRASIL").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, CITY_MAX));
  const txid = emvField("05", "***");
  const additional = emvField("62", txid);

  let body =
    payload +
    merchantAccount +
    merchantCategory +
    currency;

  if (amount && amount > 0) {
    body += emvField("54", amount.toFixed(2));
  }

  body += country + name + cityField + additional + "6304";
  body += crc16(body);
  return body;
}

export function PixQrCode({ pixKey, beneficiary, city, amount, size = 180 }: PixQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!pixKey) {
      setDataUrl(null);
      return;
    }
    try {
      const payload = buildPixPayload({ pixKey, beneficiary, city, amount });
      QRCode.toDataURL(payload, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setDataUrl(url);
        })
        .catch(() => {
          if (active) setDataUrl(null);
        });
    } catch {
      if (active) setDataUrl(null);
    }
    return () => {
      active = false;
    };
  }, [pixKey, beneficiary, city, amount, size]);

  if (!dataUrl) return null;

  return <img src={dataUrl} alt="QR code Pix" width={size} height={size} className="rounded-lg" />;
}