import { shopContactInfo } from './contact-info.js';

const locationEl = document.getElementById('shop-location');
const daysEl = document.getElementById('shop-days');
const hoursEl = document.getElementById('shop-hours');
const phoneEl = document.getElementById('shop-phone');
const whatsappEl = document.getElementById('shop-whatsapp');
const enquiryForm = document.getElementById('whatsapp-enquiry-form');
const formMessage = document.getElementById('whatsapp-form-message');

function buildWhatsappUrl(message) {
  return `https://wa.me/${shopContactInfo.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

if (locationEl) locationEl.textContent = shopContactInfo.location;
if (daysEl) daysEl.textContent = shopContactInfo.days;
if (hoursEl) hoursEl.textContent = shopContactInfo.hours;

if (phoneEl) {
  phoneEl.textContent = shopContactInfo.phoneDisplay;
  phoneEl.href = shopContactInfo.phoneHref;
}

if (whatsappEl) {
  whatsappEl.href = buildWhatsappUrl('Hello Tasty Treats, I would like to make an order enquiry.');
}

if (enquiryForm) {
  enquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('customer-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const message = document.getElementById('customer-message').value.trim();

    const whatsappMessage = [
      'Hello Tasty Treats, I would like to make an order enquiry.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Message: ${message}`
    ].join('\n');

    window.open(buildWhatsappUrl(whatsappMessage), '_blank', 'noopener,noreferrer');

    if (formMessage) {
      formMessage.textContent = 'Opening WhatsApp with your enquiry...';
      formMessage.style.display = 'block';
    }
  });
}
