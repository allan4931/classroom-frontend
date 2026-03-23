// Debug script to check localStorage and API calls
console.log('=== Dashboard Debug ===');
console.log('Token:', localStorage.getItem('nc_token')?.substring(0, 50) + '...');
console.log('User:', localStorage.getItem('nc_user'));
console.log('Refresh:', localStorage.getItem('nc_refresh')?.substring(0, 50) + '...');

// Test API calls with current token
const token = localStorage.getItem('nc_token');
if (token) {
  fetch('http://localhost:8000/api/departments', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    console.log('Departments status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Departments data:', data);
  })
  .catch(err => {
    console.error('Departments error:', err);
  });
  
  fetch('http://localhost:8000/api/classes', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    console.log('Classes status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Classes data:', data);
  })
  .catch(err => {
    console.error('Classes error:', err);
  });
} else {
  console.log('No token found in localStorage');
}
