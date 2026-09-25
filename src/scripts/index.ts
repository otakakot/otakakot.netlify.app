import {
	acceptInvite,
	getUser,
	handleAuthCallback,
	login,
	logout,
} from '@netlify/identity';
import type { User } from '@netlify/identity';

const getElement = <T extends HTMLElement>(selector: string): T => {
	const element = document.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Required element not found: ${selector}`);
	}
	return element;
};

const signedOut = getElement<HTMLElement>('#signed-out');
const signedIn = getElement<HTMLElement>('#signed-in');
const acceptInviteSection = getElement<HTMLElement>('#accept-invite');
const email = getElement<HTMLSpanElement>('#user-email');
const form = getElement<HTMLFormElement>('#login-form');
const submit = getElement<HTMLButtonElement>('#login');
const message = getElement<HTMLParagraphElement>('#message');
const inviteForm = getElement<HTMLFormElement>('#invite-form');
const inviteMessage = getElement<HTMLParagraphElement>('#invite-message');
let inviteToken: string | null = null;

const update = (user: User | null) => {
	signedOut.hidden = Boolean(user);
	signedIn.hidden = !user;
	if (user) {
		acceptInviteSection.hidden = true;
		email.textContent = user.email ?? '';
	}
};

try {
	const callback = await handleAuthCallback();
	if (callback?.type === 'invite' && callback.token) {
		inviteToken = callback.token;
		signedOut.hidden = true;
		acceptInviteSection.hidden = false;
	} else {
		update(await getUser());
	}
} catch {
	message.textContent = '招待リンクを確認できませんでした。リンクを開き直してください。';
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	message.textContent = '';
	submit.disabled = true;
	try {
		const data = new FormData(form);
		update(await login(String(data.get('email')), String(data.get('password'))));
	} catch {
		message.textContent = 'ログインできませんでした。入力内容をご確認ください。';
	} finally {
		submit.disabled = false;
	}
});

inviteForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	inviteMessage.textContent = '';
	if (!inviteToken) {
		inviteMessage.textContent =
			'招待リンクの有効期限が切れた可能性があります。管理者に再招待を依頼してください。';
		return;
	}

	const acceptButton = getElement<HTMLButtonElement>('#accept');
	acceptButton.disabled = true;
	try {
		const data = new FormData(inviteForm);
		const user = await acceptInvite(inviteToken, String(data.get('password')));
		update(user);
		inviteToken = null;
	} catch {
		inviteMessage.textContent = '招待を承認できませんでした。パスワードを確認してください。';
	} finally {
		acceptButton.disabled = false;
	}
});

getElement<HTMLButtonElement>('#logout').addEventListener('click', async () => {
	await logout();
	update(null);
});
