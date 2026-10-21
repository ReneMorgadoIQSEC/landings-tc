const icon = (name) => new URL(`../../assets/icons/${name}`, import.meta.url).href;

const BADGES = {
  buenfin: { src: icon('buenfin.png'), alt: 'Buen Fin' },
  hotsale: { src: icon('telcel-5g.png'), alt: 'Hot Sale' }
};

const template = document.createElement('template');

template.innerHTML = `
  <div class="product-card__body">
    <div class="product-card__media">
      <div class="product-card__visual">
        <span class="tag product-card__tag" data-field="tag"></span>
        <div class="product-card__photo">
          <img class="product-card__image" width="110" height="110" alt="" loading="lazy" data-field="image">
          <img class="product-card__badge" width="40" height="40" alt="" loading="lazy" hidden data-field="badge">
        </div>
      </div>
      <ul class="product-card__swatches" aria-label="Colores disponibles" data-field="swatches"></ul>
    </div>
    <div class="product-card__info">
      <div class="product-card__details">
        <p class="product-card__brand" data-field="brand"></p>
        <h3 class="product-card__name">
          <span data-field="name"></span>
          <span data-field="storage"></span>
        </h3>
        <span class="chip product-card__capacity" data-field="capacity"></span>
      </div>
      <hr class="product-card__divider">
      <div class="product-card__pricing">
        <p class="product-card__label" data-field="label"></p>
        <p class="product-card__prices">
          <s class="product-card__old-price" data-field="old-price-wrapper">
            <span class="visually-hidden">Precio anterior:</span>
            <span data-field="old-price"></span>
          </s>
          <span class="product-card__price">
            <span class="visually-hidden">Precio actual:</span>
            <span data-field="price"></span>
          </span>
        </p>
        <p class="product-card__installments" data-field="installments"></p>
        <ul class="product-card__perks" data-field="perks">
          <li class="product-card__perk product-card__perk--gift" data-field="gift-wrapper">
            <img src="${icon('gift.svg')}" width="24" height="24" alt="">
            <span data-field="gift"></span>
          </li>
          <li class="product-card__perk product-card__perk--shipping" data-field="shipping">
            <img src="${icon('shipping-free.svg')}" width="24" height="24" alt="">
            <span><span class="visually-hidden">Envío</span> Gratis</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="product-card__footer">
    <hr class="product-card__divider">
    <div class="product-card__actions">
      <a class="button button__primary product-card__cta" data-field="cta">Lo quiero</a>
    </div>
  </div>
`;

class ProductCard extends HTMLElement {
  connectedCallback() {
    if (this.rendered) {
      return;
    }

    this.rendered = true;
    this.classList.add('product-card');
    this.append(template.content.cloneNode(true));

    const tagVariant = this.getAttribute('tag-variant');
    const fullName = [this.getAttribute('brand'), this.getAttribute('name'), this.getAttribute('storage')]
      .filter(Boolean)
      .join(' ');

    this.field('brand').textContent = [this.getAttribute('brand'), this.getAttribute('model')]
      .filter(Boolean)
      .join(' | ');

    this.setText('tag', 'tag');
    this.setText('name', 'name');
    this.setText('storage', 'storage');
    this.setText('capacity', 'capacity');
    this.setText('label', 'label');
    this.setText('old-price', 'old-price', 'old-price-wrapper');
    this.setText('price', 'price');
    this.setText('installments', 'installments');
    this.setText('gift', 'gift', 'gift-wrapper');

    if (tagVariant) {
      this.field('tag').classList.add(`tag--${tagVariant}`);
    }

    const image = this.field('image');
    image.src = this.getAttribute('image');
    image.alt = fullName;

    this.renderBadge();
    this.renderSwatches();

    this.field('shipping').hidden = !this.hasAttribute('free-shipping');
    this.field('perks').hidden = !this.hasAttribute('gift') && !this.hasAttribute('free-shipping');

    const cta = this.field('cta');
    cta.href = this.getAttribute('href') ?? '#';
    this.track(cta);
    cta.setAttribute('aria-label', `Lo quiero: ${fullName}`);
  }

  // Medición (Adobe Launch, regla clicEquipo): el título se parte por "|" en 11 campos y cada uno cae en su eVar.
  // Subcategoría y UTMs vienen del <content-carousel> (data-subcategoria, data-utm).
  track(cta) {
    const carousel = this.closest('content-carousel');
    const sku = this.getAttribute('sku') ?? '';
    const campo = (name) => (this.getAttribute(name) ?? '').trim();

    cta.dataset.evento = 'clicEquipo';
    cta.dataset.titulo = [
      'Equipo', carousel?.dataset.subcategoria ?? '', campo('position'), '1', campo('brand'), campo('model'),
      campo('name'), sku, campo('color'), campo('capacity'), sku
    ].join('|');

    const utm = carousel?.dataset.utm;
    if (utm && cta.getAttribute('href') !== '#') {
      const conUtm = (query) => {
        const url = new URL(cta.getAttribute('href'), location.href);
        new URLSearchParams(query).forEach((value, key) => url.searchParams.set(key, value));
        return url.href;
      };
      // máximo de largo de URL: solo los productos que se pasan bajan de nivel (completo → legible → corto)
      const maximo = Number(carousel.dataset.utmMax || 250);
      let href = conUtm(utm);
      for (const respaldo of [carousel.dataset.utmCorto, carousel.dataset.utmMin]) {
        if (href.length <= maximo || !respaldo) break;
        href = conUtm(respaldo);
      }
      cta.href = href;
    }
  }

  renderBadge() {
    const badge = BADGES[this.getAttribute('badge')];
    const el = this.field('badge');

    if (!badge) {
      el.hidden = true;
      return;
    }

    el.src = badge.src;
    el.alt = badge.alt;
    el.hidden = false;
  }

  renderSwatches() {
    const current = { name: this.getAttribute('color'), hex: this.getAttribute('color-hex') };
    const isCurrent = ({ hex }) => hex?.toLowerCase() === current.hex?.toLowerCase();
    const colors = this.colors?.some(isCurrent) ? this.colors : [current, ...(this.colors ?? [])];

    this.field('swatches').replaceChildren(...colors.map((color) => {
      const swatch = document.createElement('li');
      const label = document.createElement('span');

      swatch.className = 'product-card__swatch';
      swatch.style.setProperty('--swatch-color', color.hex);
      label.className = 'visually-hidden';
      label.textContent = color.name?.toLowerCase() ?? '';
      swatch.append(label);

      if (colors.length > 1 && isCurrent(color)) {
        swatch.classList.add('product-card__swatch--selected');
        swatch.setAttribute('aria-current', 'true');
      }

      return swatch;
    }));
  }

  field(name) {
    return this.querySelector(`[data-field="${name}"]`);
  }

  setText(fieldName, attribute, wrapperName = fieldName) {
    const value = this.getAttribute(attribute);

    if (value) {
      this.field(fieldName).textContent = value;
    } else {
      this.field(wrapperName).hidden = true;
    }
  }
}

customElements.define('product-card', ProductCard);
