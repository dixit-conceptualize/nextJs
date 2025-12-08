let mm = gsap.matchMedia();

gsap.config({
    debug: true,
});
gsap.registerPlugin(ScrollTrigger);


// Handle video loading and autoplay
function handleVideoLoading() {
    $('.item-food video').each(function() {
        const video = this;
        const poster = $(this).siblings('figure');
        
        // When video can play, hide poster and play video
        $(video).on('canplay', function() {
            $(this).addClass('opacity-100');
            $(poster).fadeOut(300, function() {
                video.play().catch(e => console.log('Autoplay prevented:', e));
            });
        });
        
        // Show poster if video fails to load
        $(video).on('error', function() {
            $(poster).show();
        });
        
        // Initially hide video until it's ready
        $(video).addClass('opacity-0');
    });
}

$(document).ready(function () {
    
    
    // Navigation hover effects for xl screens (1280px and up)
    // Navigation hover effects for xl screens (1280px and up)
    function handleNavHover() {
        if (window.innerWidth >= 1280) {
            $('nav > ul > li.group').hover(
                function () {
                    // Mouse enter
                    $('header').addClass("hover");
                    $('body').addClass("overflow-hidden");
                },
                function () {
                    // Mouse leave
                    $('header').removeClass("hover");
                    $('body').removeClass("overflow-hidden");
                }
            );
        }
    }

    // Run on load and window resize
    handleNavHover();
    $(window).on('resize', handleNavHover);

    $(".caret").click(function (e) {
        e.preventDefault();
        $(this).parent("li").siblings("li").removeClass("open");
        $(".sub-nav").not($(this).siblings()).slideUp();

        $(this).parent("li").toggleClass("open");
        $(this).siblings(".sub-nav").slideToggle();
    });

    $(".sub-caret").click(function (e) {
        $(".sub-caret + ul").not($(this).siblings()).slideUp();
        
        $(this).siblings("ul").slideToggle();
    });


    // Header Fixed
    var header = document.querySelector("header");
    var headroom = new Headroom(header);
    headroom.init();

    //Nav Toggle
    $(".nav-toggle, .nav-backdrop").click(function (e) {
        e.preventDefault();

        $('header').toggleClass("open");

        $('body').toggleClass("overflow-hidden");
    });




    //Tab
    $(".tab-pane:first-child").addClass("!block");
    $(".nav-item:first-child").addClass("!opacity-100 active");

    $('[data-toggle="tabs"]').on('click', function (e) {
        e.preventDefault();
        var target = $(this).attr('data-target');

        // Remove opacity from all nav items and add to clicked one
        $(this).parents(".tabs").find(".nav-item").not(this).removeClass("!opacity-100 active");
        $(this).addClass("!opacity-100 active");

        // Hide all tab panes and show targetn
        $(this).parents(".tabs").find(".tab-pane").not([id = "' + target + '"]).removeClass("!block");
        $(target).addClass("!block");
    });

    //Modal
    $('[data-toggle="modal"]').on('click', function (e) {
        e.preventDefault();
        var target = $(this).attr('data-target');

        $(target).toggleClass("show");
    });
    $('.modal-backdrop').on('click', function (e) {
        $(this).parent(".modal").removeClass("show");
    });

    // Accordion functionality
    $('.accordion-header').on('click', function () {
        $(".accordion-content").not($(this).siblings(".accordion-content")).slideUp();
        $(this).siblings(".accordion-content").slideToggle();

        $(".item-accordion > span").not($(this).siblings("span")).removeClass("!opacity-100");
        $(this).siblings("span").toggleClass("!opacity-100");
    });

    // Check for RTL direction
    const isRTL = $('body').attr('dir') === 'rtl';

    //News Slider
    var $newsSlider = $('.slider-news');
    if ($newsSlider.length) {
        $newsSlider.slick({
            arrows: false,
            dots: true,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            variableWidth: true,
            swipeToSlide: true,
            touchThreshold: 10,
            autoplay: true,
            autoplaySpeed: 2000,
            rtl: isRTL
        });
    }

    //Market Slider
    var $marketSlider = $('.slider-market');
    if ($marketSlider.length) {
        var marketSettings = {
            arrows: false,
            dots: false,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            variableWidth: true,
            swipeToSlide: true,
            touchThreshold: 10,
            autoplay: true,
            autoplaySpeed: 2000,
            rtl: isRTL,
            responsive: [
                {
                    breakpoint: 768,
                    settings: 'unslick'
                }
            ]
        };
        $marketSlider.slick(marketSettings);
        $(window).on('resize', function () {
            if (window.innerWidth >= 768 && !$marketSlider.hasClass('slick-initialized')) {
                $marketSlider.slick(marketSettings);
            }

            
        });
    }

    //Space Slider
    var $spaceSlider = $('.slider-space');
    if ($spaceSlider.length) {
        $spaceSlider.slick({
            arrows: false,
            dots: true,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            variableWidth: true,
            swipeToSlide: true,
            touchThreshold: 10,
            autoplay: true,
            autoplaySpeed: 2000,
            rtl: isRTL
        });
    }



    // Click and scroll to top
    $(".scroll-top").on("click", function () {
        $("html, body").animate({ scrollTop: 0 }, 500);
    });

    $(".scroll-down").on("click", function (e) {
        e.preventDefault();

        $("html, body").animate({
            scrollTop: $(".section-title").offset().top
        }, 600); // smooth 0.6s
    });

    // Staggered translate reveal for image SVGs with different speeds
    const revealConfigs = [
        { sel: '#image-1', start: 'top 90%', end: 'top 30%', scrub: 0.6 },
        { sel: '#image-2', start: 'top 95%', end: 'top 60%', scrub: 1.4 },
        { sel: '#image-3', start: 'top 100%', end: 'top 40%', scrub: 1.0 },
        { sel: '#image-4', start: 'top 90%', end: 'top 30%', scrub: 0.6 },
        { sel: '#image-5', start: 'top 95%', end: 'top 60%', scrub: 2.0 },
    ];
    revealConfigs.forEach(cfg => {
        const el = document.querySelector(cfg.sel);
        if (!el) return;
        gsap.to(cfg.sel, {
            y: 0, // from translate-y-full (100%) to 0
            ease: 'none',
            scrollTrigger: {
                trigger: cfg.sel,
                start: cfg.start,
                end: cfg.end,
                scrub: cfg.scrub,
                // markers: true,
            }
        });
    });

    var $valuesScroller = $('.values-scroller-data');
    var $valuesSection = $('#values-section');
    var $valuesWrapper = $('.values-scroller');
    if ($valuesScroller.length && $valuesSection.length) {
        let valuesScrollerTween = null;

        // Create horizontal scrub based on overflow width (>=1024 only)
        const createValuesScroller = () => {
            const scrollerEl = $valuesScroller.get(0);
            const wrapperEl = ($valuesWrapper && $valuesWrapper.get(0)) || null;
            const viewportWidth = wrapperEl ? wrapperEl.clientWidth : window.innerWidth;
            const totalWidth = scrollerEl ? scrollerEl.scrollWidth : 0;
            const distance = Math.max(0, totalWidth - viewportWidth);
            const isRTL = $('body').attr('dir') === 'rtl';

            // Kill existing triggers on re-init
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars && t.vars.trigger === "#values-section") t.kill();
            });

            return gsap.to($valuesScroller, {
                x: () => isRTL ? distance : -distance,
                ease: "none",
                scrollTrigger: {
                    trigger: "#values-section",
                    start: "top top",
                    end: () => "+=" + distance,
                    scrub: 1,
                    rtl: isRTL,
                    pin: true,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    // markers: true,
                }
            });
        };

        const initValuesScroller = () => {
            if (window.innerWidth < 1024) return;
            gsap.set($valuesScroller, { x: 0 });
            valuesScrollerTween = createValuesScroller();
        };

        const destroyValuesScroller = () => {
            // Kill related triggers
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars && t.vars.trigger === "#values-section") t.kill();
            });
            if (valuesScrollerTween) {
                valuesScrollerTween.kill();
                valuesScrollerTween = null;
            }
            // Clear inline transforms so content is natural on mobile/tablet
            gsap.set($valuesScroller, { clearProps: 'x,transform' });
        };

        // Init based on current viewport
        initValuesScroller();

        // Handle responsive changes
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                destroyValuesScroller();
            } else {
                if (!valuesScrollerTween) {
                    initValuesScroller();
                } else {
                    ScrollTrigger.refresh();
                }
            }
        });
    }

    // Video banner scale on scroll (About Us)
    var $videoScaleSection = $('#section-video');
    if ($videoScaleSection.length) {
        var videoInner = '#block-video';
        gsap.set(videoInner, { transformOrigin: 'top center' });
        gsap.to(videoInner, {
            scaleX: 1,
            scaleY: 1,
            borderRadius: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '#section-video',
                start: 'top bottom', // when section just enters viewport
                end: 'top 25%',  // complete when bottom is 25% from top (75% up from bottom)
                scrub: true,
                // markers: true,
            }
        });
    }

    // Section image: expand and fix, then release at section end (condensed)
    const section = document.getElementById('section-image');
    const image = document.getElementById('image-animation');
    if (section && image) {
        gsap.to(image, {
            width: '100vw', height: '100vh', top: 0, left: 0, borderRadius: 0,
            ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: section, start: 'top 35%', end: 'top top', scrub: true }
        });

        let sectionTop = 0;
        const placeAbsoluteFromFixed = () => {
            const st = sectionTop || (section.getBoundingClientRect().top + window.scrollY);
            const topVal = window.scrollY - st; // exact offset where the fixed element should land
            gsap.set(image, { position: 'absolute', top: topVal, left: 0 });
        };

        ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            onRefresh: () => { sectionTop = section.getBoundingClientRect().top + window.scrollY; },
            onEnter: () => { // section reached top, make image fixed
                gsap.set(image, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 });
            },
            onLeave: () => { // section bottom reached viewport bottom, release to absolute at correct spot
                placeAbsoluteFromFixed();
            },
            onEnterBack: () => { // coming back into range from below
                gsap.set(image, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 });
            },
            onLeaveBack: () => { // went above start, restore original CSS (no inline top override)
                gsap.set(image, { clearProps: 'position,top,left,width,height,borderRadius' });
            },
            // markers: true,
        });
    }

    // Industries items animation

    let industries_tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".section-title", // Pin the entire highlight-section
            pin: false, // Pin the entire section
            start: "top center", // Pin the section when the top hits the top of the viewport
            end: "bottom bottom",
            scrub: 1, // Smooth scrubbing
            //  markers: true, // Debugging markers (optional)
        },
    });
    industries_tl.to(".title-line", {
        x: 0,
        duration: 1,
    });


    // Initialize slider functionality
    function initSlider() {
        const $sliderItems = $('.slider-market .item-food');
        const $exploreBtn = $('.btn-explore .btn');
        const windowWidth = $(window).width();
        let visibleItems = windowWidth >= 640 ? 3 : 4; // 3 items for 640-767px, 4 items for 0-639px

        // Hide all items except the initial visible ones on page load for mobile
        if (windowWidth < 768) {
            $sliderItems.slice(visibleItems).hide();

            // Show/hide explore button based on total items
            if ($sliderItems.length <= visibleItems) {
                $('.btn-explore').hide();
            }

            // Handle explore button click
            $exploreBtn.off('click').on('click', function () {
                const windowWidth = $(window).width();
                const itemsToShow = windowWidth >= 640 ? 3 : 4; // Update items to show based on current width
                const $hiddenItems = $sliderItems.filter(':hidden');
                const nextItems = $hiddenItems.slice(0, itemsToShow);

                if (nextItems.length > 0) {
                    nextItems.slideDown();

                    // Hide button if no more items to show
                    if ($hiddenItems.length <= visibleItems) {
                        $('.btn-explore').fadeOut();
                    }
                }
            });
        } else {
            // For desktop, show all items and hide the button
            $sliderItems.show();
            $('.btn-explore').hide();
        }
    }

    // Run on load and window resize
    initSlider();
    
    // Initialize video loading
    handleVideoLoading();
});