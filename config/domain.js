// config/domain.js — EN variabel styr hela domänen
// Byt 'nu' till 'se' om/när Viktor ger access till searchboost.se
const DOMAIN_TLD = 'nu';

module.exports = {
  DOMAIN_TLD,
  DOMAIN: `searchboost.${DOMAIN_TLD}`,
  OPTI_DOMAIN: `opti.searchboost.${DOMAIN_TLD}`,
  EMAIL_MIKAEL: `mikael@searchboost.${DOMAIN_TLD}`,
  EMAIL_NOREPLY: `noreply@searchboost.${DOMAIN_TLD}`,
  URL: `https://searchboost.${DOMAIN_TLD}`,
  OPTI_URL: `https://opti.searchboost.${DOMAIN_TLD}`,
};
