'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // 사용자 정보 조회
    fetchUserInfo();
  }, [router]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          // 인증 실패 - 로그인 페이지로 이동
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          router.push('/login');
        } else if (response.status === 404) {
          // 사용자를 찾을 수 없음 - 서버 재시작으로 데이터가 사라졌을 수 있음
          setError('사용자 정보를 찾을 수 없습니다. 서버가 재시작되어 데이터가 초기화되었을 수 있습니다. 다시 회원가입해주세요.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        } else {
          setError(errorData.error || '사용자 정보를 불러오는데 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordVerify = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsVerified(true);
        setPassword('');
      } else {
        const data = await response.json();
        setError(data.error || '비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleEditEmail = () => {
    setIsEditingEmail(true);
    setNewEmail(user.email);
    setEmailError('');
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setEmailError('');
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setIsUpdatingEmail(true);
    setEmailError('');

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      setEmailError('이메일을 입력해주세요.');
      setIsUpdatingEmail(false);
      return;
    }
    if (!emailRegex.test(newEmail.trim())) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      setIsUpdatingEmail(false);
      return;
    }
    if (newEmail.trim() === user.email) {
      setEmailError('현재 이메일과 동일합니다.');
      setIsUpdatingEmail(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsEditingEmail(false);
        setNewEmail('');
        alert('이메일이 변경되었습니다.');
      } else {
        const data = await response.json();
        setEmailError(data.error || '이메일 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 변경 오류:', error);
      setEmailError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || '사용자 정보를 불러올 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            회원 정보
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              메인으로
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {!isVerified ? (
          <div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              회원 정보를 확인하기 위해 비밀번호를 입력해주세요.
            </p>
            <form onSubmit={handlePasswordVerify}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {error && (
                <div style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                style={{
                  width: '100%',
                  background: isVerifying ? '#9ca3af' : '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isVerifying ? '확인 중...' : '비밀번호 확인'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem',
              color: '#0369a1',
              fontSize: '0.875rem'
            }}>
              ✓ 비밀번호 확인 완료
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  이름
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  color: '#1f2937',
                  fontSize: '1rem'
                }}>
                  {user.name}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  아이디
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  color: '#1f2937',
                  fontSize: '1rem'
                }}>
                  {user.username}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    이메일
                  </label>
                  {!isEditingEmail && (
                    <button
                      onClick={handleEditEmail}
                      style={{
                        background: 'transparent',
                        color: '#667eea',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      수정
                    </button>
                  )}
                </div>
                {isEditingEmail ? (
                  <form onSubmit={handleUpdateEmail}>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${emailError ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        marginBottom: '0.5rem'
                      }}
                      disabled={isUpdatingEmail}
                    />
                    {emailError && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        marginTop: 0
                      }}>
                        {emailError}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="submit"
                        disabled={isUpdatingEmail}
                        style={{
                          flex: 1,
                          background: isUpdatingEmail ? '#9ca3af' : '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isUpdatingEmail ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isUpdatingEmail ? '변경 중...' : '저장'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditEmail}
                        disabled={isUpdatingEmail}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isUpdatingEmail ? 'not-allowed' : 'pointer'
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '1rem'
                  }}>
                    {user.email}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  비밀번호 확인
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  color: '#166534',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>✓</span>
                  <span>비밀번호 확인 완료</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  setIsVerified(false);
                  setPassword('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#667eea',
                  border: '1px solid #667eea',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                다시 확인하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

