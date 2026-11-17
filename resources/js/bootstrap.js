import axios from 'axios';
import jQuery from 'jquery';
import select2 from 'select2/dist/js/select2.full.js';

window.axios = axios;
window.$ = window.jQuery = jQuery;

if (typeof jQuery.fn.select2 === 'undefined') {
    select2(window, jQuery);
}

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
// Only the XSRF-TOKEN cookie is sent: a static X-CSRF-TOKEN from the meta tag
// goes stale once the session is renewed and takes precedence, causing a 419.
window.axios.defaults.withXSRFToken = true;
