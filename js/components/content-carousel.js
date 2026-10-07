import { getProducts, createItemList } from '../services/products.js';

class ContentCarousel extends HTMLElement {
  connectedCallback() {
    if (this.swiper) {
      return;
    }

    const prevEl = this.querySelector('[data-carousel-prev]');
    const nextEl = this.querySelector('[data-carousel-next]');
    const spaceBetween = parseFloat(getComputedStyle(this).getPropertyValue('--spacing_sm')) || 0;

    this.swiper = new Swiper(this.querySelector('.swiper'), {
      slidesPerView: 'auto',
      spaceBetween,
      navigation: { prevEl, nextEl },
      a11y: {
        prevSlideMessage: prevEl?.getAttribute('aria-label'),
        nextSlideMessage: nextEl?.getAttribute('aria-label')
      }
    });

    if (this.hasAttribute('products-url')) {
      this.loadProducts(this.getAttribute('products-url'));
    }
  }

  disconnectedCallback() {
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.itemList?.remove();
  }

  async loadProducts(url) {
    try {
      const products = await getProducts(url);

      this.querySelector('.swiper-wrapper').replaceChildren(...products.map(createProductCard));
      this.swiper?.update();

      if (this.hasAttribute('item-list-schema')) {
        this.renderItemList(products);
      }
    } catch (error) {
      console.error(error);
    }
  }

  renderItemList(products) {
    this.itemList?.remove();
    this.itemList = document.createElement('script');
    this.itemList.type = 'application/ld+json';
    this.itemList.textContent = JSON.stringify(createItemList(products));
    document.head.append(this.itemList);
  }
}

function createProductCard({ colors, ...attributes }) {
  const card = document.createElement('product-card');

  card.colors = colors;

  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) {
      card.setAttribute(name, '');
    } else if (value) {
      card.setAttribute(name, value);
    }
  }

  card.classList.add('swiper-slide');

  return card;
}

customElements.define('content-carousel', ContentCarousel);
