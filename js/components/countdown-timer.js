const UNIT_DURATIONS = {
  days: 86400000,
  hours: 3600000,
  minutes: 60000,
  seconds: 1000
};

class CountdownTimer extends HTMLElement {
  static observedAttributes = ['date'];

  connectedCallback() {
    this.values = Object.fromEntries(
      [...this.querySelectorAll('[data-unit]')].map((element) => [element.dataset.unit, element])
    );
    this.start();
  }

  disconnectedCallback() {
    this.stop();
  }

  attributeChangedCallback() {
    if (this.values) {
      this.start();
    }
  }

  start() {
    this.stop();
    this.target = Date.parse(this.getAttribute('date'));

    if (Number.isNaN(this.target)) {
      return;
    }

    this.update();
    this.timer = setInterval(() => this.update(), UNIT_DURATIONS.seconds);
  }

  stop() {
    clearInterval(this.timer);
  }

  update() {
    const diff = Math.max(this.target - Date.now(), 0);
    let remaining = diff;

    for (const [unit, duration] of Object.entries(UNIT_DURATIONS)) {
      const value = Math.floor(remaining / duration);
      remaining -= value * duration;

      if (this.values[unit]) {
        this.values[unit].textContent = String(value).padStart(2, '0');
      }
    }

    if (diff === 0) {
      this.stop();
    }
  }
}

customElements.define('countdown-timer', CountdownTimer);
