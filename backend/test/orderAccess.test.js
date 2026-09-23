const test = require('node:test');
const assert = require('node:assert/strict');
const OrderModel = require('../dist/infrastructure/db/models/order.model.js').default;
const { requireOrderOwnerOrStaff } = require('../dist/presentation/middlewares/orderAccess.middleware.js');
const { authorizeRoles } = require('../dist/presentation/middlewares/auth.middileware.js');

const orderId = '507f1f77bcf86cd799439011';
const userId = '507f191e810c19729de860ea';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('order detail access denies another customer and allows the owner', async () => {
  const originalExists = OrderModel.exists;
  let query;
  let found = false;
  OrderModel.exists = async (filter) => { query = filter; return found ? { _id: orderId } : null; };
  try {
    const req = { role: 'client', userId, params: { orderId } };
    const denied = response();
    let nextCalls = 0;
    await requireOrderOwnerOrStaff(req, denied, () => nextCalls++);
    assert.deepEqual(query, { _id: orderId, userId });
    assert.equal(denied.statusCode, 404);
    assert.equal(nextCalls, 0);

    found = true;
    const allowed = response();
    await requireOrderOwnerOrStaff(req, allowed, () => nextCalls++);
    assert.equal(allowed.statusCode, 200);
    assert.equal(nextCalls, 1);
  } finally {
    OrderModel.exists = originalExists;
  }
});

test('order detail access rejects malformed IDs without querying and allows staff', async () => {
  const originalExists = OrderModel.exists;
  let queried = false;
  OrderModel.exists = async () => { queried = true; return null; };
  try {
    let nextCalls = 0;
    const invalid = response();
    await requireOrderOwnerOrStaff({ role: 'client', userId, params: { orderId: 'invalid' } }, invalid, () => nextCalls++);
    assert.equal(invalid.statusCode, 404);
    assert.equal(queried, false);

    const staff = response();
    await requireOrderOwnerOrStaff({ role: 'production', userId, params: { orderId } }, staff, () => nextCalls++);
    assert.equal(staff.statusCode, 200);
    assert.equal(nextCalls, 1);
    assert.equal(queried, false);
  } finally {
    OrderModel.exists = originalExists;
  }
});

test('staff route guard denies client status changes', () => {
  const guard = authorizeRoles('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging');
  const denied = response();
  let nextCalls = 0;
  guard({ role: 'client' }, denied, () => nextCalls++);
  assert.equal(denied.statusCode, 401);
  assert.equal(nextCalls, 0);
  guard({ role: 'packaging' }, response(), () => nextCalls++);
  assert.equal(nextCalls, 1);
});
