import { generateLicensePDF } from './src/services/licenseService.js';

// Mock application data for testing
const mockApplication = {
  id: 'test-app-123',
  user_id: 'test-user-456',
  license_type: 'shop-establishment',
  application_data: {
    email: 'shruti@example.com',
    phone: '+917720051264',
    aadhaar: '234578903456',
    address: 'Qtr.no 149/3, Raghuji Nagar,Somwari Peth, Nagpur',
    fullName: 'Shruti Satish Chedge'
  }
};

const licenseNumber = 'SHO-632962-REL';
const issueDate = new Date('2025-11-05');
const expiryDate = new Date('2025-11-05');
expiryDate.setFullYear(expiryDate.getFullYear() + 1);

console.log('Testing PDF generation...');
generateLicensePDF(mockApplication, licenseNumber, issueDate, expiryDate)
  .then(result => {
    console.log('PDF generated successfully!');
    console.log('File path:', result.filePath);
    console.log('File size:', result.fileSize, 'bytes');
  })
  .catch(error => {
    console.error('PDF generation failed:', error.message);
  });