// Test API connection from frontend perspective
const BACKEND_URL = 'http://localhost:8000';

async function testAPI() {
  console.log('Testing API connection to:', BACKEND_URL);
  
  // Test login
  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@university.edu', 
        password: 'Fx2Y8g9f#' 
      }),
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', loginRes.status, await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('Login successful, token:', loginData.token?.substring(0, 50) + '...');
    
    // Test departments with token
    const deptRes = await fetch(`${BACKEND_URL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!deptRes.ok) {
      console.error('Departments API failed:', deptRes.status, await deptRes.text());
      return;
    }
    
    const deptData = await deptRes.json();
    console.log('Departments count:', deptData.pagination?.total || deptData.data?.length);
    console.log('Departments:', deptData.data?.map(d => d.name));
    
    // Test classes with token
    const classRes = await fetch(`${BACKEND_URL}/api/classes`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!classRes.ok) {
      console.error('Classes API failed:', classRes.status, await classRes.text());
      return;
    }
    
    const classData = await classRes.json();
    console.log('Classes count:', classData.pagination?.total || classData.data?.length);
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();
