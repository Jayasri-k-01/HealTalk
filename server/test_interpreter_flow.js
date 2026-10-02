const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING HEALTALK INTERPRETER FLOW VERIFICATION ---');

  const testInterpEmail = `interp_test_${Date.now()}@healtalk.com`;
  const testPassword = 'Password123!';

  // Step 1: Register New Interpreter
  console.log('\n[Step 1] Registering new interpreter:', testInterpEmail);
  const regRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Elena Rostova',
    email: testInterpEmail,
    password: testPassword,
    role: 'interpreter',
    phone: '+1 555-0199',
    languages: ['English', 'Russian', 'Spanish'],
    experience: 5,
    qualification: 'Certified Medical Interpreter (CMI)',
    documentUrl: 'https://example.com/docs/cmi-cert.pdf'
  });

  console.log('Registration Status Code:', regRes.statusCode);
  console.log('Registration Response:', JSON.stringify(regRes.data, null, 2));

  if (regRes.statusCode !== 201) {
    throw new Error('Interpreter registration failed');
  }
  if (regRes.data.user.status !== 'pending' || regRes.data.user.isVerified !== false) {
    throw new Error(`Expected pending & isVerified:false, got status: ${regRes.data.user.status}, isVerified: ${regRes.data.user.isVerified}`);
  }
  console.log('✅ Registration successfully saved account as status = "pending" and isVerified = false.');

  // Step 2: Unverified Interpreter attempts login
  console.log('\n[Step 2] Unverified interpreter attempts login...');
  const loginRes1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testInterpEmail,
    password: testPassword
  });

  console.log('Login Status Code:', loginRes1.statusCode);
  console.log('Login Response:', JSON.stringify(loginRes1.data, null, 2));

  if (loginRes1.statusCode !== 403) {
    throw new Error(`Expected 403 Forbidden on unverified login, got ${loginRes1.statusCode}`);
  }
  const expectedMsg = "Your interpreter account is pending admin verification. You can access the application after approval.";
  if (loginRes1.data.message !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${loginRes1.data.message}"`);
  }
  if (loginRes1.data.token) {
    throw new Error('Token should NOT be issued for unverified interpreter!');
  }
  console.log('✅ Login correctly blocked by backend with 403 and pending verification message.');

  // Step 3: Admin logs in
  console.log('\n[Step 3] Admin logging in...');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@healtalk.com',
    password: 'admin123'
  });

  if (adminLoginRes.statusCode !== 200 || !adminLoginRes.data.token) {
    throw new Error('Admin login failed');
  }
  const adminToken = adminLoginRes.data.token;
  console.log('✅ Admin login successful.');

  // Step 4: Admin checks Pending interpreters
  console.log('\n[Step 4] Admin fetching pending interpreter applications...');
  const pendingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users?role=interpreter&status=pending',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Pending Interpreters Status Code:', pendingRes.statusCode);
  const pendingList = pendingRes.data.users || [];
  const foundPending = pendingList.find(u => u.email === testInterpEmail);
  console.log('Found newly registered interpreter in Pending list:', !!foundPending);

  if (!foundPending) {
    throw new Error('Newly registered interpreter not found in pending list');
  }
  console.log('✅ Newly registered interpreter is visible in Admin Pending list with details & documents.');

  // Step 5: Admin Approves the interpreter
  console.log('\n[Step 5] Admin approving interpreter ID:', foundPending._id);
  const approveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${foundPending._id}/status`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    status: 'approved'
  });

  console.log('Approve Status Code:', approveRes.statusCode);
  console.log('Approve Response:', JSON.stringify(approveRes.data, null, 2));

  if (approveRes.statusCode !== 200 || approveRes.data.user.status !== 'approved' || !approveRes.data.user.isVerified) {
    throw new Error('Failed to approve interpreter or update status/isVerified');
  }
  console.log('✅ Admin successfully approved interpreter. Status is now "approved" and isVerified is true.');

  // Step 6: Interpreter logs in after approval
  console.log('\n[Step 6] Approved interpreter logs in...');
  const loginRes2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testInterpEmail,
    password: testPassword
  });

  console.log('Approved Login Status Code:', loginRes2.statusCode);
  console.log('Approved Login Response:', JSON.stringify(loginRes2.data, null, 2));

  if (loginRes2.statusCode !== 200 || !loginRes2.data.token) {
    throw new Error('Approved interpreter login failed');
  }
  console.log('✅ Interpreter logged in successfully! Token received.');

  // Step 7: Test Rejection Flow
  console.log('\n[Step 7] Testing Rejection Flow for another interpreter...');
  const rejectInterpEmail = `interp_rej_${Date.now()}@healtalk.com`;
  await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Reject Candidate',
    email: rejectInterpEmail,
    password: testPassword,
    role: 'interpreter',
    languages: ['French', 'English']
  });

  // Admin finds and rejects
  const pendingRes2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users?role=interpreter&status=pending',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });

  const rejectCandidate = pendingRes2.data.users.find(u => u.email === rejectInterpEmail);
  const rejectReason = 'Incomplete language qualification certificates.';
  const rejectRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${rejectCandidate._id}/status`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    status: 'rejected',
    rejectionReason: rejectReason
  });

  console.log('Admin Reject Status Code:', rejectRes.statusCode);

  // Rejected interpreter attempts login
  const rejectLoginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: rejectInterpEmail,
    password: testPassword
  });

  console.log('Rejected Login Status Code:', rejectLoginRes.statusCode);
  console.log('Rejected Login Message:', rejectLoginRes.data.message);

  if (rejectLoginRes.statusCode !== 403 || !rejectLoginRes.data.message.includes(rejectReason)) {
    throw new Error('Rejected interpreter was not properly blocked with rejection reason');
  }
  console.log('✅ Rejected interpreter blocked from login with rejection reason displayed.');

  // Step 8: Verify Existing User Logins (Doctor & Patient)
  console.log('\n[Step 8] Verifying Doctor and Patient Logins...');
  const docLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'doctor@healtalk.com',
    password: 'doctor123'
  });
  if (docLogin.statusCode !== 200) throw new Error('Existing doctor login failed');

  const patLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'patient@healtalk.com',
    password: 'patient123'
  });
  if (patLogin.statusCode !== 200) throw new Error('Existing patient login failed');

  console.log('✅ Existing approved Doctor and Patient logins are working perfectly.');

  console.log('\n🎉 ALL INTERPRETER VERIFICATION & AUTH FLOW TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
