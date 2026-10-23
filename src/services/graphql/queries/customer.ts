export const GET_CURRENT_CUSTOMER = `
query GetCurrentCustomer {
  getCurrentCustomer {
    uuid
    fullName
    emailAddress
    phoneNumber
  }
}
`.trim();

export const GET_CUSTOMER_ADDRESSES = `
query GetCustomerAddresses($pageNumber: Int, $itemsPerPage: Int) {
  getCustomerAddresses(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    fullName
    phoneNumber
    streetAddress
    apartment
    zipCode
    city
    state
    country
    isDefault
  }
}
`.trim();

export type GetCustomerAddressesVariables = {
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export const GET_CUSTOMER_WISHLIST = `
query GetCustomerWishlist($language: String, $currency: String, $pageNumber: Int, $itemsPerPage: Int) {
  getCustomerWishlist(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    product {
      uuid
      slug
      title(language: $language)
      brief(language: $language)
      description(language: $language)
      descriptionHtml(language: $language)
      featuredImageUrl
      featuredThumbnailUrl
      status
      salesCount
      likesCount
      reviewsCount
      ratingAvg
      ratingOneStarCount
      ratingTwoStarCount
      ratingThreeStarCount
      ratingFourStarCount
      ratingFiveStarCount
      campaign {
        uuid
        name(language: $language)
        brief(language: $language)
        slug
        discountPercentage
        startsAt
        finishesAt
      }
    }
    variant {
      uuid
      title
      sku
      barcode
      price(currency: $currency) {
        amount
        minorAmount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        minorAmount
        currencyCode
      }
      weight {
        amount
        unit
      }
      dimensions {
        width
        height
        length
        unit
      }
      images {
        uuid
        imageUrl
        thumbnailUrl
        alt
        isFeatured
        position
      }
    }
  }
}
`.trim();

export type GetCustomerWishlistVariables = {
  language?: string | null;
  currency?: string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export const GET_CUSTOMER_WISHLIST_COUNT = `
query GetCustomerWishlistCount {
  getCustomerWishlistCount
}
`.trim();

export const GET_CUSTOMER_CART = `
query GetCustomerCart($language: String, $currency: String) {
  getCustomerCart(language: $language, currency: $currency) {
    uuid
    product {
      uuid
      slug
      title(language: $language)
      brief(language: $language)
      description(language: $language)
      descriptionHtml(language: $language)
      featuredImageUrl
      featuredThumbnailUrl
      status
      salesCount
      likesCount
      reviewsCount
      ratingAvg
      ratingOneStarCount
      ratingTwoStarCount
      ratingThreeStarCount
      ratingFourStarCount
      ratingFiveStarCount
      campaign {
        uuid
        name(language: $language)
        brief(language: $language)
        slug
        discountPercentage
        startsAt
        finishesAt
      }
    }
    variant {
      uuid
      title(language: $language)
      sku
      barcode
      price(currency: $currency) {
        amount
        minorAmount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        minorAmount
        currencyCode
      }
      weight {
        amount
        unit
      }
      dimensions {
        width
        height
        length
        unit
      }
      images {
        uuid
        imageUrl
        thumbnailUrl
        alt
        isFeatured
        position
      }
      optionValues {
        optionValue {
          uuid
          value(language: $language)
          position
          option {
            uuid
            name(language: $language)
            position
          }
        }
      }
    }
    quantity
    availableStock
    subTotal {
      amount
      minorAmount
      currencyCode
    }
    discountPrice {
      amount
      minorAmount
      currencyCode
    }
    total {
      amount
      minorAmount
      currencyCode
    }
  }
}
`.trim();

export type GetCustomerCartVariables = {
  language?: string | null;
  currency?: string | null;
};

export const GET_CUSTOMER_CART_COUNT = `
query GetCustomerCartCount {
  getCustomerCartCount
}
`.trim();

export const GET_CUSTOMER_SAVED_CARDS = `
query GetCustomerSavedCards {
  getCustomerSavedCards {
    uuid
    tokenId
    cardBrand
    last4
    expiryMonth
    expiryYear
    isActive
    isDefault
    customer {
      uuid
      fullName
    }
  }
}
`.trim();
