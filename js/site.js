/**
 * site.js
 * Good Cop Bad Cop
 * Author: Jonathan Nicol (jonathannicol.com)
 */

var goodcopbadcop_common = (function($) {

  var els;
  var imagesPreloaded = false;
  var fontsLoaded = false;
  var pageLoaded = false;
  var startTime = new Date().getTime();
  var preloadInterval;
  var pageRendered = false;
  var sectionTops = {};
  var scrollTop = 0;
  var winW = 0;
  var winH = 0;
  var prevViewportWidth = 0;
  var isMobile = Modernizr.touch; // TODO: Update this to a more comprehensive test for mobile devices
  var parallaxEnabled = true;
  var heroH = '';
  var ticking = false;
  var smallBreakpoint = 568;
  var mediumBreakpoint = 768;
  var largeBreakpoint = 1024;
  var xlargeBreakpoint = 1240;
  var xxlargeBreakpoint = 1600;

  /**
   * Initialization
   */
  function init () {

    // Selector aliases. Avoid selecting the same element twice.
    els = {
      $window: $(window),
      $document: $(document),
      $html: $('html'),
      $body: $('body'),
      $hidden: $('.u-hidden'),
      $headerBar: $('.header-bar'),
      $pageWrap: $('.l-page-wrap'),
      $nav: $('.nav-primary'),
      $heroImage: $('.hero-image')
    }

    preparePage();

    // Loading
    // ------------------------------------------
    
    // Preload images
    var imagesToLoad = [];
    var screenW = Math.max(screen.width, screen.height);
    // First parallax image
    if (screenW < 900) {
      $('[data-src-sm]:lt(1)').each(function(){
        imagesToLoad.push($(this).attr('data-src'));
      });
    } else {
      $('[data-src]:lt(1)').each(function(){
        imagesToLoad.push($(this).attr('data-src'));
      });
    }
    // First n regular images
    $('img[src]:lt(1)').each(function(){
      imagesToLoad.push($(this).attr('src'));
    });
    preloadImages(imagesToLoad, function() {
      imagesPreloaded = true;
    });

    // Preload page
    els.$window.load(function(){
      pageLoaded = true;
    });

    // Web font load checker
    $('.menu-toggle').fontChecker({
      timeOut: 5000,
      loadingClass: '',
      timeoutClass: '',
      onLoad: function() {
        fontsLoaded = true;
      },
      onTimeout: function() {
        fontsLoaded = true;
      }
    });

    // Poll for image & page load. Timeout after 10 seconds.
    preloadInterval = window.setInterval(function() {
      var time = new Date().getTime();
      var elapsed = time - startTime;
      var minTime = 0; // minimum time to display load indicator
      var timout = 10000; // maximum time to display load indicator
      // If the user has been waiting a while, show them a load inidicator so they
      // don't get frustrated by staring at a blank page.
      if (elapsed > 1000 && !$('.page-loader').is(':visible')) {
        showPageLoader();
      }
      if (elapsed > timout) {
        console.log('preload timeout');
      }
      if ((elapsed > timout) || (imagesPreloaded && fontsLoaded && pageLoaded && elapsed > minTime)) {
        window.clearInterval(preloadInterval);
        hidePageLoader();
        window.setTimeout(function() {
          renderPage();
        }, 500);
      }
    }, 100);
  }

  /**
   * Get accurate viewport width/height
   * usage: viewport().width or viewport().height
   */
  function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
  }

   /**
   * Preload images
   * Source: http://stackoverflow.com/questions/8264528/image-preloader-javascript-that-supports-events/8265310#8265310
   */
  function preloadImages(srcs, callback) {
    var img;
    var total = srcs.length;
    var remaining = srcs.length;
    var percentage = 0;
    if (remaining === 0) { callback(); }
    for (var i = 0; i < srcs.length; i++) {
      img = new Image();
      img.onload = function() {
        --remaining;
        // percentage = Math.ceil((total - remaining) / total * 100);
        // els.$loaderBar.css({
        //   width: percentage + '%'
        // });
        if (remaining <= 0) {
          callback();
        }
      };
      img.src = srcs[i];
      console.log('preloading image: ' + srcs[i]);
    }
  }

  function showPageLoader(){
    $('.page-loader').velocity({
      opacity: 1
    },{
      duration: 250,
      display: 'block'
    });
  }

  function hidePageLoader(){
    $('.page-loader').velocity('stop').velocity({
      opacity: 0
    },{
      duration: 250,
      display: 'none'
    });
  }

  /**
   * Render data-src images
   */
  function preparePage() {
    var screenW = Math.max(screen.width, screen.height);

    // Render home images
    $('.home-feature__img').each(function() {
      var $el = $(this);
      if (screenW > 900) {
        src = $el.attr('data-src');
        $el.css({
          'background-image': 'url(' + $el.attr('data-src') + ')'
        });
      }
    });

    // Remove home y-pos cookie if it's not required
    if (!$('body').hasClass('single-gcbc_projects') && !$('body').hasClass('home')) {
      Cookies.remove('home-y-pos');
    }

    // Stop vimeo vids displaying before page fades in
    $('.video-container').css({opacity:0});

    // Render parallax images
    els.$heroImage.each(function() {
      var $el = $(this);
      if (screenW > 900) {
        $el.css({
          'background-image': 'url(' + $el.attr('data-src') + ')'
        });
      }
    });
  }

  /**
   * Render page
   */
  function renderPage() {
    // console.log('rendering page');

    pageRendered = true;

    // Scroll to previous scroll position if closing a project, otherwise scroll to top of page
    var scrollTarg = 0;
    if ($('body').hasClass('home')) {
      if (Cookies.get('home-y-pos')) {
        scrollTarg = Cookies.get('home-y-pos');
        Cookies.remove('home-y-pos');
      }
    }
    $('html, body').animate({
      'scrollTop': scrollTarg
    }, 1);

    // Create mobile nav menu
    $('.nav-primary').clone().prependTo('body').removeClass('nav-primary').removeAttr('id').addClass('l-nav-menu nav-mobile').find('ul').removeClass('nav-menu').addClass('l-nav-menu-mobile');
    $('.nav-secondary .nav-menu > li').clone().appendTo('.l-nav-menu-mobile');

    // Disable header waypoint
    if ($('body').hasClass('home')) {
      els.$headerBar.addClass('header-bar--enable-waypoint');
    }

    // Images fade in on load
    $('.thumb-grid img').css({opacity: 0});
    $('.thumb-grid').imagesLoaded()
      .progress(function(instance, image) {
        var $img = $(image.img);
        $img.fadeTo(400, 1);
    });

    // Post thumbs masonry
    if ($('.thumb-grid--posts').length) {
      var $container = $('.thumb-grid--posts');

      $container.imagesLoaded(function() {
        $container.masonry({
          itemSelector: '.masonry-item'
        });
      });

      $container.infinitescroll({
        navSelector: '.pagination',
        nextSelector: '.pagination a:last-child',
        itemSelector: '.masonry-item',
        debug: false,
        prefill: false,
        bufferPx: 500,
        loading: {
          finishedMsg: 'No more article to load',
          img: theme.assets_dir + '/img/loader-reverse.gif',
          msgText: 'Loading more articles...',
          speed: 0, // Because infinite scroll uses show() to reveal loader, which animates width/height = ugly
        }
      }, function(newElements) {
        // Append and fade in new items
        var $newElems = $(newElements).css({opacity: 0});
        $('.thumb-grid--posts').masonry('appended', $newElems);
        $newElems.animate({ opacity: 1 }, 400);
        // Fade in each image once it has loaded
        $newElems.each(function(){
          var img = $(this).find('img');
          img.css({opacity:0});
          img.imagesLoaded(function(){
            img.animate({ opacity: 1 }, 400);
          });
        });
      });
    }

    scaleLayout();
    headerWaypoint();
    setupEventHandlers();

    // Fade in hidden content
    $('.video-container').css({opacity:''});
    $('.l-page-wrap').removeClass('invisible').addClass('fade-in');

    // els.$window.trigger('resize');
  }

  /**
   * Button handlers
   */
  function setupEventHandlers() {
    // Nav menu events
    var eventType = Modernizr.touch ? 'touchstart' : 'mousedown';
    $('.menu-toggle').on(eventType, function() {
      if (!$('html').hasClass('menu-open')) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    // $('.menu__close').on('mousedown', function() {
    //   closeMenu();
    // });
    
    // Scroll-to-content button
    $('.scroll-down').on('click', function(){
      var scrollTargY = $('.hero').outerHeight() - 60; // 60px is nav bar height
      $('html, body').animate({
        scrollTop: scrollTargY
      }, 750);
    });

    // Return to previous scroll position when closing project
    $('.js-project-link').on('click', function(e) {
      Cookies.set('home-y-pos', scrollTop, { expires: 1 });
    });

    // Resize
    $(window).on('resize', $.throttle(10, function() {
      if (!Modernizr.touch) { Cookies.remove('home-y-pos'); }
      scaleLayout();
      headerWaypoint();
    }));

    // Scroll
    $(window).on('scroll', function() {
      scrollTop = els.$window.scrollTop();
      requestTick();
    });
  }

  /**
   * Request scroll tick
   */
  function requestTick() {
    if(!ticking) {
      ticking = true;
      requestAnimationFrame(scrollHandler);
    }
  }

  /**
   * Scroll handler
   */
  function scrollHandler() {
    headerWaypoint();
    ticking = false;
  }

  /**
   * Scale layout
   */
  function scaleLayout() {
    winW = viewport().width;
    winH = viewport().height;

    // Scale home hero image
    // Fix for iOS fixed position background scaling
    // @ see http://stackoverflow.com/questions/24944925/background-image-jumps-when-address-bar-hides-ios-android-mobile-chrome
    if (!isMobile || prevViewportWidth != winW) {
      $('.hero--home').css({
        height: winH
      });
    }

    // Scale hero image
    els.$heroImage.each(function(i, item) {
      var $el = $(this);
      var minH = winW > mediumBreakpoint && winH < 750 ? winH - 60 : 0;
      var minVisibleArea = $el.hasClass('hero-image--post') ? (60 + 130) : 60; // 60px is header bar height, 130px is an arbitrary amount
      // Fix for iOS fixed position background scaling
      // @ see http://stackoverflow.com/questions/24944925/background-image-jumps-when-address-bar-hides-ios-android-mobile-chrome
      if (!isMobile || prevViewportWidth != winW) {
        // Ensure image is never taller than viewport
        var defaultHeroH = winW * (720/1280);
        if (defaultHeroH > (winH - minVisibleArea)) {
          heroH = winH - minVisibleArea;
        } else {
          heroH = defaultHeroH;
        }
      }
      $el.css({
        'padding-bottom': Math.max(heroH, minH)
      });
    });

    // Scale project video
    var availVideoH = winH - 60 - 130;
    if (winW/availVideoH > 16/9) {
      $('.project-video').addClass('project-video--constrained').css({
        'max-width': Math.max((winH - 60 - 130) * (16/9), 600)
      });
    } else {
      $('.project-video').removeClass('project-video--constrained').css({
        'max-width': ''
      });
    }
    
    // Capture transitions between breakpoints
    if (prevViewportWidth <= smallBreakpoint && viewport().width > smallBreakpoint && !isMobile) {
      // transitioning from phone to tablet size
    } else if (prevViewportWidth > smallBreakpoint && viewport().width <= smallBreakpoint && !isMobile) {
      // transitioning from tablet to phone size
    }

    prevViewportWidth = viewport().width;
  }

  /**
   * Header waypoint
   */
  function headerWaypoint() {
   if ($('body').hasClass('home') && scrollTop >= winH) {
      els.$headerBar.addClass('header-bar--show-logos');
    } else {
      els.$headerBar.removeClass('header-bar--show-logos');
    }
  }

  /**
   * Open navigation menu
   */
  function openMenu() {
    els.$html.addClass('menu-open');
    $('.nav-mobile').css({'height':els.$pageWrap.height()});
    window.setTimeout(function() {
      els.$html.addClass('menu-open-anim');
    }, 25);
    hamburgerAnimated = true;

    $('.hamburger-bar:nth-child(1)').velocity('stop', true).velocity({
      top: 30
    }, {
      delay: 0,
      duration: 400
    }).velocity({
      rotateZ: '45deg'
    }, {
      duration: 400
    });
    $('.hamburger-bar:nth-child(2)').velocity('stop', true).velocity({
      opacity: 0,
    }, {
      delay: 400,
      duration: 1
    });
    $('.hamburger-bar:nth-child(3)').velocity('stop', true).velocity({
      top: 30
    }, {
      delay: 0,
      duration: 400
    }).velocity({
      rotateZ: '-45deg'
    }, {
      duration: 400
    });
  }

  /**
   * Close navigation menu
   */
  function closeMenu() {
    els.$html.removeClass('menu-open stockists-open contact-open').addClass('menu-closing');
    window.setTimeout(function() {
      els.$html.removeClass('menu-open-anim');
    }, 25);
    window.setTimeout(function() {
      els.$html.removeClass('menu-closing');
    }, 600);

    if (hamburgerAnimated) {
      // Once the sidebar has closed (delay 500ms), animate the cross back to a hamburger icon
      $('.hamburger-bar:nth-child(1)').velocity({
        rotateZ: '0deg'
      }, {
        delay: 0,
        duration: 400
      }).velocity({
        top: 24
      }, {
        duration: 400
      });
      $('.hamburger-bar:nth-child(2)').velocity({
        opacity: 1
      }, {
        delay: 400,
        duration: 1
      });
      $('.hamburger-bar:nth-child(3)').velocity({
        rotateZ: '0deg'
      }, {
        delay: 0,
        duration: 400
      }).velocity({
        top: 36
      }, {
        duration: 400
      });
    }
  }

  /**
   * Reset hamburger bar animations
   */
  function resetHamburgerIcon() {
    hamburgerAnimated = false;
    $('.hamburger-bar').css({
      opacity: '',
      top: '',
      transform: '',
      width: viewportW > navBreakpoint ? 17 : 9
    });
  }

  /**
   * Expose public properties and methods
   */
  return {
    init: init
  };

}(jQuery));

jQuery(document).ready(function ($) {
  goodcopbadcop_common.init();
}(jQuery));
