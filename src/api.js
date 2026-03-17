// ── Base URL: empty string in dev (Vite proxy), full URL in prod ──
const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('pcs_token');
}

async function request(method, path, body, isMultipart = false) {
  const token = getToken();
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isMultipart) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: isMultipart ? body : body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('pcs_token');
    window.location.href = '/';
    return;
  }

  // Read the response body
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // If the server says 401, it means wrong password
    if (res.status === 401) {
      throw new Error("Invalid Username or Password");
    }
    throw new Error(data.error || `Error ${res.status}`);
  }
  
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const api = {
  auth: {
    login:          (body)        => request('POST', '/auth/login', body),
    changePassword: (body)        => request('POST', '/auth/change-password', body),
    me:             ()            => request('GET',  '/auth/me'),
  },

  // ── Admin ────────────────────────────────────────────────────────
  admin: {
    getUsers:       ()            => request('GET',  '/admin/users'),
    createUser:     (body)        => request('POST', '/admin/users', body),
    updateUser:     (id, body)    => request('PUT',  `/admin/users/${id}`, body),
    resetPassword:  (id, body)    => request('POST', `/admin/users/${id}/reset-password`, body),
  },

  // ── Vouchers ─────────────────────────────────────────────────────
  vouchers: {
    list:             ()           => request('GET',  '/vouchers'),
    get:              (id)         => request('GET',  `/vouchers/${id}`),
    create:           (body)       => request('POST', '/vouchers', body),
    update:           (id, body)   => request('PUT',  `/vouchers/${id}`, body),
    submit:           (id)         => request('POST', `/vouchers/${id}/submit`),
    managerApprove:   (id)         => request('POST', `/vouchers/${id}/manager-approve`),
    managerReject:    (id, body)   => request('POST', `/vouchers/${id}/manager-reject`, body),
    approve:          (id)         => request('POST', `/vouchers/${id}/approve`),
    reject:           (id, body)   => request('POST', `/vouchers/${id}/reject`, body),
    pay:              (id)         => request('POST', `/vouchers/${id}/pay`),
    validateCharge:   (params)     => request('GET',  `/vouchers/validate-charge?${new URLSearchParams(params)}`),
  },

  // ── Attachments ──────────────────────────────────────────────────
  attachments: {
    list:     (voucherId)         => request('GET',  `/attachments/${voucherId}`),
    upload:   (voucherId, formData) => request('POST', `/attachments/${voucherId}`, formData, true),
    download: (id)                => `${BASE}/api/attachments/download/${id}`,
    delete:   (id)                => request('DELETE', `/attachments/${id}`),
  },

  // ── Funding ──────────────────────────────────────────────────────
  funding: {
    fundHolders:  ()              => request('GET',  '/funding/fund-holders'),
    fund:         (body)          => request('POST', '/funding/fund', body),
    close:        (body)          => request('POST', '/funding/close', body),
    transactions: (userId)        => request('GET',  `/funding/transactions/${userId}`),
  },

  // ── Employees ────────────────────────────────────────────────────
  employees: {
    list:   ()                    => request('GET',  '/employees'),
    create: (body)                => request('POST', '/employees', body),
    update: (code, body)          => request('PUT',  `/employees/${code}`, body),
    delete: (code)                => request('DELETE', `/employees/${code}`),
  },

  // ── Expense types ─────────────────────────────────────────────────
  expenseTypes: {
    list:   ()                    => request('GET',  '/expense-types'),
    create: (body)                => request('POST', '/expense-types', body),
    update: (id, body)            => request('PUT',  `/expense-types/${id}`, body),
    delete: (id)                  => request('DELETE', `/expense-types/${id}`),
  },

  // ── Masters ──────────────────────────────────────────────────────
  divisions: {
    list:   ()                    => request('GET',  '/divisions'),
    create: (body)                => request('POST', '/divisions', body),
    update: (id, body)            => request('PUT',  `/divisions/${id}`, body),
    delete: (id)                  => request('DELETE', `/divisions/${id}`),
  },
  departments: {
    list:   ()                    => request('GET',  '/departments'),
    create: (body)                => request('POST', '/departments', body),
    update: (id, body)            => request('PUT',  `/departments/${id}`, body),
    delete: (id)                  => request('DELETE', `/departments/${id}`),
  },
  projects: {
    list:   ()                    => request('GET',  '/projects'),
    create: (body)                => request('POST', '/projects', body),
    update: (id, body)            => request('PUT',  `/projects/${id}`, body),
    delete: (id)                  => request('DELETE', `/projects/${id}`),
  },
};

export default api;
