const icon = (name) => new URL(`../../assets/icons/${name}`, import.meta.url).href;

const template = document.createElement('template');

template.innerHTML = `
  <div class="product-card__body">
    <div class="product-card__media">
      <div class="product-card__visual">
        <span class="tag product-card__tag" data-field="tag"></span>
        <img class="product-card__image" width="110" height="110" alt="" loading="lazy" data-field="image">
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
      <button class="button button__link" type="button" data-field="compare">Comparar</button>
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

    this.renderSwatches();

    this.field('shipping').hidden = !this.hasAttribute('free-shipping');
    this.field('perks').hidden = !this.hasAttribute('gift') && !this.hasAttribute('free-shipping');

    const cta = this.field('cta');
    cta.href = this.getAttribute('href') ?? '#';
    cta.setAttribute('aria-label', `Lo quiero: ${fullName}`);

    const compare = this.field('compare');
    compare.setAttribute('aria-label', `Comparar ${fullName}`);
    compare.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('product-compare', {
        detail: {
          brand: this.getAttribute('brand'),
          model: this.getAttribute('model'),
          name: fullName
        },
        bubbles: true
      }));
    });
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
