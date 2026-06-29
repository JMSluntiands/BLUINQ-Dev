import axios from 'axios';
import jQuery from 'jquery';
import select2 from 'select2/dist/js/select2.full.js';

window.axios = axios;
window.$ = window.jQuery = jQuery;

if (typeof jQuery.fn.select2 === 'undefined') {
    select2(window, jQuery);
}

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
