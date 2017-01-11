/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if ('serviceWorker' in navigator) {
  // Your service-worker.js *must* be located at the top-level directory relative to your site.
  // It won't be able to control pages unless it's located at the same level or higher than them.
  // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
  // See https://github.com/slightlyoff/ServiceWorker/issues/468
  navigator.serviceWorker.register('./service.worker.js').then(function(reg) {
    // updatefound is fired if service-worker.js changes.
    if (reg.active) {
      // Load the app here.
      loadApp();
      addMainCss();
    }

    reg.onupdatefound = function() {
      // The updatefound event implies that reg.installing is set; see
      // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
      var installingWorker = reg.installing;

      installingWorker.onstatechange = function() {
        switch (installingWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // At this point, the old content will have been purged and the fresh content will
              // have been added to the cache.
              // It's the perfect time to display a "New content is available; please refresh."
              // message in the page's interface.
              console.log('New or updated content is available.');
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a "Content is cached for offline use." message.
              console.log('Content is now available offline!');

              // Load the app here.
              loadApp();
              addMainCss();
            }
            break;

          case 'redundant':
              var failCount = window.sessionStorage.getItem("serviceWorkerFailCount") || 0;
              window.sessionStorage.setItem("serviceWorkerFailCount", parseInt(failCount) + 1);
              if (failCount < 2) {
                location.reload();
              }
              else {
                showPraxisDownloadError();
              }
            break;
        }
      };
    };
  }).catch(function(e) {
    console.error('Error during service worker registration:', e);
  });
}

var addMainCss = function () {
  var link = document.createElement('link');
  link.href = 'css/main.css';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  document.head.appendChild(link);
};

var loadApp = function () {
  var script = document.createElement('script');
  script.src = 'js/lib/requirejs/require.js';
  script.dataset.main = 'js/app/pwa/pwa.app.bootstrap.js';
  script.onload = function () {};
  document.head.appendChild(script);

  document.getElementById('loadingPraxis').style.display = 'none';
};

var showPraxisDownloadError = function () {
  document.getElementById('loadingPraxisMsg').style.display = 'none';
  document.getElementById('loadingPraxisError').style.display = 'block';
};
