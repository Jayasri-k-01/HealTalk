const http = require('http');

const PORT = process.env.PORT || 5002;

function request(options, data) {
  options.hostname = '127.0.0.1';
  options.port = PORT;
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

async function run() {
  console.log('=== STARTING INTERPRETER REQUEST & ASSIGNMENT WORKFLOW VERIFICATION ===\n');

  // 1. Patient Login
  console.log('[1] Logging in as Patient (patient@healtalk.com)...');
  const patLogin = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'patient@healtalk.com',
    password: 'Patient@123'
  });

  if (patLogin.statusCode !== 200) {
    throw new Error(`Patient login failed: ${JSON.stringify(patLogin.data)}`);
  }
  const patToken = patLogin.data.token;
  console.log('✅ Patient login successful. User:', patLogin.data.user.name);

  // 2. Doctor Login
  console.log('\n[2] Logging in as Doctor (doctor@healtalk.com)...');
  const docLogin = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'doctor@healtalk.com',
    password: 'Doctor@123'
  });

  if (docLogin.statusCode !== 200) {
    throw new Error(`Doctor login failed: ${JSON.stringify(docLogin.data)}`);
  }
  const docToken = docLogin.data.token;
  console.log('✅ Doctor login successful. User:', docLogin.data.user.name);

  // 3. Interpreter Login
  console.log('\n[3] Logging in as Interpreter (interpreter@healtalk.com)...');
  const interpLogin = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'interpreter@healtalk.com',
    password: 'Interpreter@123'
  });

  if (interpLogin.statusCode !== 200) {
    throw new Error(`Interpreter login failed: ${JSON.stringify(interpLogin.data)}`);
  }
  const interpToken = interpLogin.data.token;
  console.log('✅ Interpreter login successful. User:', interpLogin.data.user.name);

  // 4. Fetch or Book an Appointment for Patient
  console.log('\n[4] Patient booking appointment with doctor...');
  const doctorsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/doctors',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${patToken}` }
  });

  const doctorsList = doctorsRes.data.doctors || doctorsRes.data || [];
  const doctor = doctorsList[0];
  if (!doctor) throw new Error('No doctor found');

  const randomSlotTime = `${Math.floor(Math.random() * 12) + 1}:00 PM`;
  const bookingDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const bookRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    doctorId: doctor._id,
    date: bookingDate,
    time: randomSlotTime,
    type: 'Video Call',
    reason: 'Hypertension consultation and routine checkup',
  });

  if (bookRes.statusCode !== 201) {
    throw new Error(`Failed to book appointment: ${JSON.stringify(bookRes.data)}`);
  }
  const appointmentId = bookRes.data.appointment._id;
  console.log('✅ Appointment created! ID:', appointmentId);

  // Doctor confirms appointment
  console.log('\n[5] Doctor confirms appointment...');
  const confirmRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/appointments/${appointmentId}/confirm`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  if (confirmRes.statusCode !== 200) {
    throw new Error(`Doctor confirmation failed: ${JSON.stringify(confirmRes.data)}`);
  }
  console.log('✅ Appointment confirmed by Doctor. Status is now Confirmed.');

  // 6. Patient Requests Interpreter (Spanish)
  console.log('\n[6] Patient requests interpreter for language "Spanish"...');
  const reqInterpRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/appointments/${appointmentId}/interpreter`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    language: 'Spanish'
  });

  if (reqInterpRes.statusCode !== 200) {
    throw new Error(`Request interpreter failed: ${JSON.stringify(reqInterpRes.data)}`);
  }
  console.log('✅ Interpreter request saved successfully! interpreterRequested:', reqInterpRes.data.appointment.interpreterRequested, 'interpreterStatus:', reqInterpRes.data.appointment.interpreterStatus);

  // Check duplicate request is blocked
  console.log('\n[6b] Verifying duplicate interpreter request is blocked...');
  const dupReq = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/appointments/${appointmentId}/interpreter`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    language: 'Spanish'
  });
  if (dupReq.statusCode !== 400) {
    throw new Error(`Expected duplicate request to be rejected with 400, got ${dupReq.statusCode}`);
  }
  console.log('✅ Duplicate request correctly rejected with 400:', dupReq.data.message);

  // 7. Doctor sees interpreter requested
  console.log('\n[7] Doctor checks appointments to verify interpreter request status...');
  const docAptsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments/doctor',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const docFound = docAptsRes.data.appointments.find(a => a._id === appointmentId);
  if (!docFound || !docFound.interpreterRequested || docFound.interpreterStatus !== 'Requested' || docFound.interpreterLanguage !== 'Spanish') {
    throw new Error(`Doctor side interpreter request mismatch: ${JSON.stringify(docFound)}`);
  }
  console.log('✅ Doctor sees appointment has interpreterRequested = true, language = "Spanish", interpreterStatus = "Requested"');

  // 8. Interpreter views matching open requests
  console.log('\n[8] Interpreter fetches available matching requests...');
  const availableRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments/interpreter/requests',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${interpToken}` }
  });

  if (availableRes.statusCode !== 200) {
    throw new Error(`Fetch available requests failed: ${JSON.stringify(availableRes.data)}`);
  }
  const matchingReq = availableRes.data.requests.find(r => r._id === appointmentId);
  if (!matchingReq) {
    throw new Error(`Appointment ${appointmentId} was not found in matching requests for interpreter!`);
  }
  console.log('✅ Interpreter found matching request in available queue:');
  console.log('   - Patient:', matchingReq.patient?.name);
  console.log('   - Doctor:', matchingReq.doctor?.name || matchingReq.doctorName);
  console.log('   - Date & Time:', matchingReq.date, matchingReq.time);
  console.log('   - Required Language:', matchingReq.interpreterLanguage);
  console.log('   - Status:', matchingReq.interpreterStatus);

  // 9. Interpreter Accepts Request
  console.log('\n[9] Interpreter accepts the request...');
  const acceptRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/appointments/${appointmentId}/interpreter/accept`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${interpToken}` }
  });

  if (acceptRes.statusCode !== 200) {
    throw new Error(`Accept interpreter request failed: ${JSON.stringify(acceptRes.data)}`);
  }
  console.log('✅ Interpreter successfully accepted request!');
  console.log('   - Interpreter assigned:', acceptRes.data.appointment.interpreter?.name);
  console.log('   - Status:', acceptRes.data.appointment.interpreterStatus);

  // 10. Patient checks appointment to see Interpreter Accepted
  console.log('\n[10] Patient verifies appointment has interpreter assigned...');
  const patAptsRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments/my',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${patToken}` }
  });

  const patFound = patAptsRes.data.appointments.find(a => a._id === appointmentId);
  if (!patFound || patFound.interpreterStatus !== 'Accepted' || !patFound.interpreter) {
    throw new Error(`Patient does not see accepted interpreter: ${JSON.stringify(patFound)}`);
  }
  console.log('✅ Patient sees Interpreter Confirmed:', patFound.interpreter.name, `(${patFound.interpreterLanguage})`);

  // 11. Doctor checks appointment to see Interpreter Accepted
  console.log('\n[11] Doctor verifies appointment has interpreter assigned...');
  const docAptsRes2 = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments/doctor',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${docToken}` }
  });

  const docFound2 = docAptsRes2.data.appointments.find(a => a._id === appointmentId);
  if (!docFound2 || docFound2.interpreterStatus !== 'Accepted' || !docFound2.interpreter) {
    throw new Error(`Doctor does not see accepted interpreter: ${JSON.stringify(docFound2)}`);
  }
  console.log('✅ Doctor sees Interpreter Assigned:', docFound2.interpreter.name, `(${docFound2.interpreterLanguage})`);

  // 12. Interpreter views assigned sessions
  console.log('\n[12] Interpreter views their assigned sessions...');
  const myAssignedRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/appointments/interpreter/my',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${interpToken}` }
  });

  const assignedItem = myAssignedRes.data.appointments.find(a => a._id === appointmentId);
  if (!assignedItem) {
    throw new Error(`Appointment ${appointmentId} not in interpreter's assigned sessions list`);
  }
  console.log('✅ Appointment is now listed in Interpreter\'s assigned sessions!');

  console.log('\n🎉 ALL INTERPRETER REQUEST AND ASSIGNMENT WORKFLOW TESTS PASSED 100% SUCCESSFULLY! 🎉');
}

run().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
