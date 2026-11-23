/**
 * Certificate PDF renderer (#98, used for issuing in #99). Server-side (jsPDF + qrcode).
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { DEFAULT_TEMPLATE, renderMergeFields } from './certificate-template.js';

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ''));
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [139, 108, 188];
}

function imageFormat(dataUrl) {
  return /^data:image\/png/i.test(dataUrl) ? 'PNG' : 'JPEG';
}

function imageSize(doc, dataUrl, maxW, maxH) {
  try {
    const p = doc.getImageProperties(dataUrl);
    const ratio = Math.min(maxW / p.width, maxH / p.height);
    return { w: p.width * ratio, h: p.height * ratio };
  } catch {
    return { w: maxW, h: maxH };
  }
}

function addImageSafe(doc, dataUrl, x, y, w, h) {
  try {
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {object} args
 * @param {object} args.template      template fields (see DEFAULT_TEMPLATE)
 * @param {object} args.values        merge values (buildCertificateValues)
 * @param {string} [args.verifyUrl]   printed and encoded in the QR code
 * @param {string} [args.accreditationLogoDataUrl]
 * @param {string} [args.watermark]   e.g. "PREVIEW" or "REVOKED"
 * @returns {Promise<Buffer>}
 */
export async function buildCertificatePdf({ template, values, verifyUrl, accreditationLogoDataUrl, watermark }) {
  const t = { ...DEFAULT_TEMPLATE, ...(template || {}) };
  const landscape = t.orientation !== 'PORTRAIT';
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const color = hexToRgb(t.primaryColor);
  const ink = [30, 16, 53];
  const muted = [100, 116, 139];
  const cx = W / 2;

  // Background or frame
  if (!(t.backgroundDataUrl && addImageSafe(doc, t.backgroundDataUrl, 0, 0, W, H))) {
    doc.setDrawColor(...color);
    doc.setLineWidth(2.2);
    doc.rect(8, 8, W - 16, H - 16);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, W - 24, H - 24);
    doc.setFillColor(...color);
    doc.rect(12, 12, W - 24, 3, 'F');
  }

  if (watermark) {
    doc.saveGraphicsState?.();
    doc.setTextColor(238, 242, 247);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(landscape ? 110 : 90);
    doc.text(watermark, cx, H / 2 + 20, { align: 'center', angle: landscape ? 18 : 35 });
    doc.restoreGraphicsState?.();
  }

  let y = landscape ? 26 : 32;

  // Logos: institution centred (or left when there is an accreditation logo), accreditation right.
  if (t.logoDataUrl) {
    const s = imageSize(doc, t.logoDataUrl, 46, 22);
    const x = accreditationLogoDataUrl ? 22 : cx - s.w / 2;
    addImageSafe(doc, t.logoDataUrl, x, y, s.w, s.h);
  }
  if (accreditationLogoDataUrl) {
    const s = imageSize(doc, accreditationLogoDataUrl, 40, 22);
    addImageSafe(doc, accreditationLogoDataUrl, W - 22 - s.w, y, s.w, s.h);
  }
  y += t.logoDataUrl || accreditationLogoDataUrl ? 30 : 8;

  if (values.institutionName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...muted);
    doc.text(values.institutionName.toUpperCase(), cx, y, { align: 'center', charSpace: 0.6 });
    y += 10;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(landscape ? 32 : 28);
  doc.setTextColor(...color);
  const title = renderMergeFields(t.titleText, values);
  doc.text(doc.splitTextToSize(title, W - 60), cx, y + 6, { align: 'center' });
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...muted);
  doc.text('This is to certify that', cx, y, { align: 'center' });
  y += 13;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(landscape ? 30 : 26);
  doc.setTextColor(...ink);
  doc.text(values.participantName || '', cx, y, { align: 'center' });
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(cx - 70, y + 3, cx + 70, y + 3);
  y += 13;

  const body = renderMergeFields(t.bodyTemplate, values);
  if (body) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12.5);
    doc.setTextColor(...ink);
    const lines = doc.splitTextToSize(body, landscape ? W - 90 : W - 50);
    doc.text(lines, cx, y, { align: 'center', lineHeightFactor: 1.4 });
    y += lines.length * 6.5 + 4;
  }

  const meta = [
    values.completionDate ? `Completed ${values.completionDate}` : null,
    values.cpdHours ? `${values.cpdHours} CPD hour${values.cpdHours === '1' ? '' : 's'}` : null,
    values.cpdPoints ? `${values.cpdPoints} CPD point${values.cpdPoints === '1' ? '' : 's'}` : null,
  ].filter(Boolean).join('   ·   ');
  if (meta) {
    doc.setFontSize(10.5);
    doc.setTextColor(...muted);
    doc.text(meta, cx, y, { align: 'center' });
    y += 6;
  }
  if (values.accreditationBody) {
    doc.setFontSize(9.5);
    doc.text(`Accredited by ${values.accreditationBody}${values.accreditationNumber ? ` (${values.accreditationNumber})` : ''}`, cx, y, { align: 'center' });
  }

  // Signatories along the bottom
  const sigs = (t.signatories || []).slice(0, 3);
  const sigY = H - (landscape ? 46 : 58);
  if (sigs.length) {
    const slot = (W - 80) / sigs.length;
    sigs.forEach((s, i) => {
      const sx = 40 + slot * i + slot / 2;
      if (s.signatureDataUrl) {
        const size = imageSize(doc, s.signatureDataUrl, 44, 16);
        addImageSafe(doc, s.signatureDataUrl, sx - size.w / 2, sigY - size.h - 1, size.w, size.h);
      }
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(sx - 28, sigY, sx + 28, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...ink);
      doc.text(s.name || '', sx, sigY + 5, { align: 'center' });
      if (s.title) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...muted);
        doc.text(doc.splitTextToSize(s.title, 60)[0], sx, sigY + 9.5, { align: 'center' });
      }
    });
  }

  // Footer: number, verification, QR
  const footY = H - 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  if (values.certificateNumber) doc.text(`Certificate no. ${values.certificateNumber}`, 20, footY);
  if (verifyUrl) doc.text(`Verify: ${verifyUrl}`, 20, footY + 4.5);
  const footer = renderMergeFields(t.footerText, values);
  if (footer) doc.text(doc.splitTextToSize(footer, W - 90)[0], cx, footY + 4.5, { align: 'center' });
  if (t.showQr && verifyUrl) {
    const qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 240, errorCorrectionLevel: 'M' });
    addImageSafe(doc, qr, W - 20 - 22, H - 20 - 22 + 4, 22, 22);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
