// RBH Unlimited — site interactions & contact form
(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  // Contact form
  var form = document.getElementById('contact-form');
  if (!form) return;
  var statusEl = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var buttonText = button.textContent;

  function showStatus(type, message) {
    statusEl.className = 'form-status ' + type;
    statusEl.textContent = message;
    statusEl.hidden = false;
  }

  // Result of a non-JS (redirect) submission
  var params = new URLSearchParams(window.location.search);
  if (params.has('sent')) showStatus('success', 'Thank you! Your message has been sent. We will get back to you shortly.');
  if (params.has('error')) showStatus('error', 'Sorry, your message could not be sent. Please check the form and try again.');

  function setFieldError(input, message) {
    var field = input.closest('.field');
    var existing = field.querySelector('.field-error');
    if (existing) existing.remove();
    field.classList.toggle('invalid', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) {
      var err = document.createElement('span');
      err.className = 'field-error';
      err.textContent = message;
      field.appendChild(err);
    }
  }

  function validate() {
    var ok = true;
    var name = form.elements.name;
    var email = form.elements.email;
    var phone = form.elements.phone;
    var message = form.elements.message;

    var nameErr = name.value.trim().length < 2 ? 'Please enter your name.' : '';
    var emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? 'Please enter a valid email address.' : '';
    var phoneErr = phone.value.trim() && !/^[0-9+()\-\s.]{5,40}$/.test(phone.value.trim()) ? 'Please enter a valid phone number.' : '';
    var msgErr = message.value.trim().length < 10 ? 'Please enter at least 10 characters.' : '';

    [[name, nameErr], [email, emailErr], [phone, phoneErr], [message, msgErr]].forEach(function (pair) {
      setFieldError(pair[0], pair[1]);
      if (pair[1] && ok) { pair[0].focus(); ok = false; }
    });
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    if (!validate()) return;

    button.disabled = true;
    button.textContent = 'Sending…';

    // Submissions are delivered by FormSubmit (static hosting has no backend).
    // The AJAX endpoint returns JSON instead of redirecting.
    var data = new FormData(form);
    data.set('_subject', '[Website] ' + data.get('subject') + ' — ' + String(data.get('name')).trim());
    data.set('_replyto', String(data.get('email')).trim());
    data.delete('_next');

    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { success: 'false', message: 'Unexpected server response. Please try again later.' };
        });
      })
      .then(function (res) {
        var ok = String(res.success) === 'true';
        showStatus(ok ? 'success' : 'error', ok
          ? 'Thank you! Your message has been sent. We will get back to you shortly.'
          : (res.message || 'Sorry, your message could not be sent. Please try again later.'));
        if (ok) form.reset();
      })
      .catch(function () {
        showStatus('error', 'Network error. Please check your connection and try again.');
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = buttonText;
        statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
  });
})();
