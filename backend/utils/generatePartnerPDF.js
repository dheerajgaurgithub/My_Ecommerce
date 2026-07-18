import PDFDocument from 'pdfkit';

export async function generateDeliveryPartnerPDF(partner) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Delivery Partner Registration Details', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text('Mahir & Friends', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Official Document', { align: 'center' });
      doc.moveDown();

      // Divider
      doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Personal Details Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Personal Details', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const personalDetails = [
        ['Full Name:', partner.personalDetails?.fullName || 'N/A'],
        ['Email:', partner.personalDetails?.email || 'N/A'],
        ['Contact Number:', partner.personalDetails?.contactNumber || 'N/A'],
        ['Date of Birth:', partner.personalDetails?.dateOfBirth ? new Date(partner.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A'],
        ['Gender:', partner.personalDetails?.gender || 'N/A'],
      ];

      personalDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // KYC Details Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('KYC Details', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const kycDetails = [
        ['Aadhar Number:', partner.kycDetails?.aadharNumber || 'N/A'],
        ['PAN Number:', partner.kycDetails?.panNumber || 'N/A'],
        ['KYC Status:', partner.kycDetails?.kycStatus || 'N/A'],
        ['Verified At:', partner.kycDetails?.verifiedAt ? new Date(partner.kycDetails.verifiedAt).toLocaleString() : 'N/A'],
      ];

      kycDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // Profile Picture (Selfie)
      if (partner.kycDetails?.selfie) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Profile Picture (Face Identity)', { underline: true });
        doc.moveDown(0.3);
        
        try {
          // Check if selfie is a URL or base64
          let imagePath = partner.kycDetails.selfie;
          
          // If it's a URL starting with http, we'll need to handle it differently
          // For now, assuming it's a local file path or base64
          if (imagePath.startsWith('data:image')) {
            // Base64 image - need to convert to buffer
            const base64Data = imagePath.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            doc.image(buffer, 50, doc.y, { width: 150, height: 150 });
          } else if (imagePath.startsWith('http')) {
            // URL - would need to fetch, but for PDFKit we'll skip and show placeholder
            doc.fontSize(10).fillColor('#666666').text('Profile picture URL: ' + imagePath);
          } else {
            // Local file path
            doc.image(imagePath, 50, doc.y, { width: 150, height: 150 });
          }
          doc.moveDown(2);
        } catch (error) {
          console.warn('Profile picture not found or invalid, skipping image:', error.message);
          doc.fontSize(10).fillColor('#666666').text('Profile picture not available');
          doc.moveDown();
        }
      }

      // Vehicle Details Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Vehicle Details', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const vehicleDetails = [
        ['Vehicle Type:', partner.vehicleDetails?.vehicleType || 'N/A'],
        ['Vehicle Number:', partner.vehicleDetails?.vehicleNumber || 'N/A'],
        ['Vehicle Model:', partner.vehicleDetails?.vehicleModel || 'N/A'],
        ['Vehicle Color:', partner.vehicleDetails?.vehicleColor || 'N/A'],
      ];

      vehicleDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // Address Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Address', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const address = partner.address || {};
      const addressText = `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
      if (address.landmark) {
        doc.text(`Address: ${addressText} (Landmark: ${address.landmark})`);
      } else {
        doc.text(`Address: ${addressText}`);
      }

      doc.moveDown();

      // Bank Details Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Bank Details', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const bankDetails = [
        ['Account Number:', partner.bankDetails?.accountNumber || 'N/A'],
        ['Account Holder Name:', partner.bankDetails?.accountHolderName || 'N/A'],
        ['IFSC Code:', partner.bankDetails?.ifscCode || 'N/A'],
        ['Bank Name:', partner.bankDetails?.bankName || 'N/A'],
      ];

      bankDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // Payout Settings
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Payout Settings', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const payoutDetails = [
        ['Payout Frequency:', partner.payoutSettings?.payoutFrequency || 'N/A'],
        ['UPI ID:', partner.payoutSettings?.upiId || 'N/A'],
      ];

      payoutDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // Emergency Contact
      if (partner.emergencyContact?.name) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Emergency Contact', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#000000');

        const emergencyDetails = [
          ['Name:', partner.emergencyContact.name],
          ['Relationship:', partner.emergencyContact.relationship || 'N/A'],
          ['Contact Number:', partner.emergencyContact.contactNumber || 'N/A'],
        ];

        emergencyDetails.forEach(([label, value]) => {
          doc.text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown();
      }

      // Registration Details
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('Registration Details', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');

      const registrationDetails = [
        ['Registration Date:', partner.createdAt ? new Date(partner.createdAt).toLocaleString() : 'N/A'],
        ['Status:', partner.status || 'N/A'],
        ['Joining Fee:', `₹${partner.joiningFee?.amount || 0}`],
        ['Joining Fee Status:', partner.joiningFee?.paid ? 'Paid' : 'Pending'],
      ];

      registrationDetails.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
      });

      doc.moveDown();

      // Approval Section
      if (partner.adminApproval?.approvedAt) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#22c55e').text('Approval Details', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#22c55e');

        const approvalDetails = [
          ['Approved By:', partner.adminApproval.approvedBy || 'N/A'],
          ['Title:', partner.adminApproval.approvedByTitle || 'N/A'],
          ['Approved At:', partner.adminApproval.approvedAt ? new Date(partner.adminApproval.approvedAt).toLocaleString() : 'N/A'],
        ];

        approvalDetails.forEach(([label, value]) => {
          doc.text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown();
      }

      // Footer with signature
      doc.moveDown(2);
      doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#22c55e').text('Approved By:', { continued: true });
      doc.fontSize(12).font('Helvetica').fillColor('#22c55e').text(` ${partner.adminApproval?.approvedBy || 'Dheeraj Gaur'}`);
      doc.fontSize(10).font('Helvetica').fillColor('#22c55e').text(`${partner.adminApproval?.approvedByTitle || 'Co-founder/Founder of Mahir & Friends'}`);
      doc.moveDown(0.5);

      // Add signature image
      try {
        const signaturePath = 'D:\\project\\public\\signature.png';
        doc.image(signaturePath, 50, doc.y, { width: 150 });
        doc.moveDown(2);
      } catch (error) {
        console.warn('Signature image not found, skipping image');
      }

      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text('This document is electronically generated and does not require a physical signature.');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
