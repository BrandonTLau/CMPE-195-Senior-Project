const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/auth');

describe('auth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('rejects request with no token', () => {
    req.header.mockReturnValue(undefined);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.stringMatching(/token/i),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects empty string token', () => {
    req.header.mockReturnValue('');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects malformed token', () => {
    req.header.mockReturnValue('not-a-real-jwt');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.any(String),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects token signed with wrong secret', () => {
    const badToken = jwt.sign({ user: { id: 'abc' } }, 'wrong_secret', { expiresIn: '1h' });
    req.header.mockReturnValue(badToken);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects expired token', () => {
    const expiredToken = jwt.sign(
      { user: { id: 'abc' } },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    req.header.mockReturnValue(expiredToken);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts valid token and populates req.user', () => {
    const validToken = jwt.sign(
      { user: { id: 'user123' } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    req.header.mockReturnValue(validToken);
    authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 'user123' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('reads token specifically from x-auth-token header', () => {
    const validToken = jwt.sign(
      { user: { id: 'user456' } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    req.header.mockReturnValue(validToken);
    authMiddleware(req, res, next);
    expect(req.header).toHaveBeenCalledWith('x-auth-token');
    expect(next).toHaveBeenCalled();
  });
});