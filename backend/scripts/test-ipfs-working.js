import axios from 'axios';

console.log('🚀 Starting IPFS test...');

// Use immediate function call instead of top-level await
(async function() {
  try {
    console.log('1. Testing basic HTTP...');
    const testResponse = await axios.get('https://httpbin.org/get', { 
      timeout: 3000 
    });
    console.log('✅ Basic HTTP works! Status:', testResponse.status);
    
    console.log('2. Testing IPFS gateway...');
    const ipfsResponse = await axios.get('https://ipfs.io', { 
      timeout: 5000 
    });
    console.log('✅ IPFS gateway accessible! Status:', ipfsResponse.status);
    
    console.log('🎉 All tests passed! IPFS should work.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Check your internet connection!');
    }
  }
})();