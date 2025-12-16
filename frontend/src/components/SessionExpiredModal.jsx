import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSessionToken } from '../services/api';

/**
 * SessionExpiredModal
 * Props:
 * - isOpen: boolean (show/hide)
 * - onClose: function to call when the modal is dismissed
 */
export default function SessionExpiredModal({ isOpen = false, onClose = () => {} }) {
	const navigate = useNavigate();

	if (!isOpen) return null;

	const handleGoToLogin = () => {
		try {
			clearSessionToken();
		} catch (e) {
			// best-effort
		}
		navigate('/login');
	};

	return (
		<div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Session expired">
			<div style={modalStyle}>
				<h2 style={{ margin: 0, marginBottom: 8 }}>Session expired</h2>
				<p style={{ marginTop: 0, marginBottom: 20, color: '#444' }}>
					Your session has expired. For your security you'll be returned to the login screen.
				</p>

				<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
					<button
						onClick={onClose}
						aria-label="Close"
						style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
					>
						Stay
					</button>

					<button
						onClick={handleGoToLogin}
						aria-label="Go to login"
						style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#0b5cff', color: 'white', cursor: 'pointer' }}
					>
						Back to login
					</button>
				</div>
			</div>
		</div>
	);
}

const overlayStyle = {
	position: 'fixed',
	inset: 0,
	background: 'rgba(0,0,0,0.6)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 10001
};

const modalStyle = {
	width: 'min(560px, 90%)',
	background: '#fff',
	padding: 24,
	borderRadius: 12,
	boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
};

