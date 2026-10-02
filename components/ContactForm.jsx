'use client';

import { useState } from 'react';
import Magnetic from './Magnetic';
import { isValidEmail, WEB3FORMS_ACCESS_KEY } from '@/lib/web3forms';

const initialFields = { name: '', email: '', message: '' };

export default function ContactForm() {
  const [fields, setFields] = useState(initialFields);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fields.name.trim()) {
      setStatus('error');
      setError('Enter your name.');
      return;
    }
    if (!isValidEmail(fields.email)) {
      setStatus('error');
      setError('Enter a valid email address.');
      return;
    }
    if (!fields.message.trim()) {
      setStatus('error');
      setError('Enter a message.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'New BluNeuron IRIZ support request',
          from_name: fields.name,
          name: fields.name,
          email: fields.email,
          message: fields.message,
          source: 'support-contact-form',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Something went wrong. Please try again.');
      }
      setStatus('success');
      setFields(initialFields);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <p className="glass-panel p-8 text-sm font-semibold text-accent-soft" role="status">
        Thanks — your message is in. Our team will get back to you shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel space-y-4 p-6 sm:p-8">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-white/50">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          autoComplete="name"
          value={fields.name}
          onChange={update('name')}
          className="w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-white/50">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={update('email')}
          className="w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-white/50">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={fields.message}
          onChange={update('message')}
          className="w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft"
        />
      </div>

      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <Magnetic
        as="button"
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        strength={0.1}
      >
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </Magnetic>
    </form>
  );
}
