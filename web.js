class Website {
  constructor() {
    this.$content = null;
    this.$scrollElem = null;
    this.$divsWithBlurredBackgrounds = null;
    this.$mediaPopup = null;
    this.$particleVideo = null;
    this.width = null;
    this.sectionHeight = null;

    this.projects = [];
    this.tags = [];
    this.filters = [];

    this.moreInfoFadeTime = 250;
    this.loadedImages = false;

    this.blurImageW = 1500;
    this.blurImageH = 1000;
    this.projectsNumRows = 3;

    this.$content = $("#content");
    this.$scrollElem = $("body");

    this.particles = new Particles();
  }

  setupParticles = options => {
    const diffusedImage = Math.floor(Math.random() * 7) + 2;
    if (jQuery.browser.mobile || !Detector.webgl) {
      const videoHtml = `
			<video loop autoplay muted id="particleVideo">
				<source src="/videos/particles${Math.floor(
          Math.random() * 8 + 1
        )}.mp4" type="video/mp4">
			</video>
			`;
      $("#home-section").append(videoHtml);
      this.$particleVideo = $("#particleVideo");
    } else {
      $.ajax({
        type: "GET",
        url: "/images/diffuser/" + diffusedImage + ".js",
        contentType: "application/text; charset=utf-8",
        dataType: "text",
        success: data => {
          this.particles.init($("#particleCanvas")[0], data, 450, 450, options);
        },
        error: error => {}
      });
    }
  };

  setupMainSite = () => {
    this.projects = content.projects.filter(project => project);
    this.createProjectSlides(this.projects, "#projects-section");
    this.createIndex();
    this.initFullPage();
    this.resize();
  };

  setupLibrariesAndEventsListeners = () => {
    Galleria.run(".media", {
      transition: "fade",
      imageCrop: false,
      swipe: "true",
      clicknext: "true",
      showImagenav: false,
      imageMargin: 50,
      wait: true,
      showCounter: false,
      thumbnails: "lazy",
      youtube: { enablejsapi: 1 }
    });

    Pace.on("hide", () => {
      $("#loadingScreen").fadeOut(500);
    });

    $(".backgroundImage").on("load", e => {
      $(e.currentTarget).fadeIn();
    });

    $(".mediaButton").click(e => {
      this.openPopup($(e.currentTarget));
    });

    $(".mediaPopup .closeButton").click(() => {
      this.closePopup();
    });
  };

  createProjectSlides = (projects, containerSelector) => {
    // build content
    for (const project of projects) {
      const audioClipsHtml = project.audioClips
        ? `<div class='audioClips'>
					${project.audioClips
            .map(audioClip => {
              return `<a href='${audioClip.url}'>${audioClip.description}</a>`;
            })
            .join("")} 
				</div>`
        : "";

      const tagsHtml = project.tags
        .map(tag => {
          return `<div class='tag'>${tag}</div>`;
        })
        .join("");

      const mediaHtml = project.media
        ? `<div class='mediaPopup' style="background-image: url('/images/${
            project.backgroundImage
          }-1500px-blur.jpg')">
				<div class='media'>
					${project.media
            .map(mediaItem => {
              return `<a href="${mediaItem.url}"><img src="${mediaItem.thumb}"></a>`;
            })
            .join("")}
				</div>
				<div class='closeButton'/>
			</div>`
        : "";

      const buttonsHtml = project.buttons
        ? project.buttons
            .map(button => {
              return `<a href="${button.url}" class="bigButton" currentTarget="_blank">${button.text}</a>`;
            })
            .join("")
        : "";

      const html = `<div data-anchor='${project.id}' class='slide'>"
					<img data-src='/images/${
            project.backgroundImage
          }-1500px-blur.jpg' class='blurredBackgroundImage'>
					<img data-src='/images/${
            project.backgroundImage
          }-1500px.jpg' class='backgroundImage'>
					<div class='slideHeaders'>
						<h1 class='slideTitle'>${project.name}</h1>
						<h2 class='slideSubtitle'>${project.detail}</h2>
						<div class='tags'>
							${tagsHtml}
						</div>
					</div>
					<div class='slideDescription'>
						<p>${project.description}</p>
						${audioClipsHtml}
						<div>
							${project.media ? "<div class='mediaButton'>Media</div>" : ""}
							${buttonsHtml}
						</div>
					</div>
					${mediaHtml}
			</div>			
			`;

      $(containerSelector).append(html);
    }

    this.$divsWithBlurredBackgrounds = $(
      ".slideHeaders h1, .slideHeaders h2, .slideDescription, .tag"
    );
  };

  initFullPage = options => {
    this.fullpage = new fullpage("#content", {
      licenseKey: "E0D715A0-8AAC4D18-910F93E2-884E4DB0",
      //Navigation
      lockAnchors: false,
      //Scrolling
      css3: true,
      scrollingSpeed: 300,
      autoScrolling: true,
      fitToSection: true,
      fitToSectionDelay: 200,
      scrollBar: false,
      easing: "easeInOutCubic",
      easingcss3: "ease",
      loopBottom: false,
      loopTop: false,
      loopHorizontal: false,
      continuousVertical: false,
      normalScrollElements: "#element1, .element2",
      scrollOverflow: false,
      touchSensitivity: 15,
      normalScrollElementTouchThreshold: 5,
      navigation: true,
      navigationPosition: "right",
      navigationTooltips: ["Home", "Index", "Projects", "About"],
      showActiveTooltip: false,
      slidesNavigation: true,
      slidesNavPosition: "bottom",
      //Accessibility
      keyboardScrolling: true,
      animateAnchor: true,
      recordHistory: true,

      //Design
      controlArrows: false,
      verticalCentered: false,
      resize: false,
      //paddingBottom: '40px',
      responsiveWidth: 0,
      responsiveHeight: 0,
      dragAndMove: false,
      dragAndMoveKey: "cm9iY2xvdXRoLmNvbV8xaDRaSEpoWjBGdVpFMXZkbVU9UzlH",

      //events
      onLeave: (index, nextIndex, direction) => {
        this.closePopup();
      },
      afterLoad: (origin, destination) => {
        if (destination.index !== 0) {
          $("#fp-nav span").removeClass("dark");

          this.stopParticles();
          this.loadImages();
        } else if (destination.index == 0) {
          $("#fp-nav span").addClass("dark");
          this.startParticles();
        }
      },
      onSlideLeave: (
        anchorLink,
        index,
        slideIndex,
        direction,
        nextSlideIndex
      ) => {
        const $nextSectionSlide = $("#projects-section .fp-slide ").eq(
          nextSlideIndex
        );
        this.loadSlideBackground($nextSectionSlide);

        if (direction === "right" && $nextSectionSlide.next().length > 0) {
          this.loadSlideBackground($nextSectionSlide.next());
        } else if (
          direction === "left" &&
          $nextSectionSlide.prev().length > 0
        ) {
          this.loadSlideBackground($nextSectionSlide.prev());
        }
      },
      ...options
    });
  };

  loadImages() {
    if (!this.loadedImages) {
      const $blurredImages = $(".blurredBackgroundImage");
      $blurredImages.each((i, blurredImage) => {
        $(blurredImage).attr("src", $(blurredImage).attr("data-src"));
      });
      this.resize();
      this.loadedImages = true;
    }
  }

  loadSlideBackground = $slide => {
    const $image = $slide.find(".backgroundImage");
    $image.attr("src", $image.attr("data-src"));
  };

  startParticles() {
    this.particles.start();
    this.$particleVideo && this.$particleVideo[0].play();
  }

  stopParticles() {
    this.particles.stop();
    this.$particleVideo && this.$particleVideo[0].pause();
  }

  openPopup = $slide => {
    this.$mediaPopup = $slide.parentsUntil(".project").siblings(".mediaPopup");
    this.$mediaPopup.css("display", "block");
    this.$mediaPopup.transition(
      {
        opacity: 1
      },
      this.moreInfoFadeTime
    );

    this.fullpage.setAllowScrolling(false, "left, right");
    $(".fp-slidesNav").fadeOut(this.moreInfoFadeTime);
    $("#gridViewButton").fadeOut(this.moreInfoFadeTime);
  };

  closePopup() {
    if (!this.$mediaPopup) return;

    this.$mediaPopup.transition(
      {
        opacity: 0
      },
      this.moreInfoFadeTime,
      () => {
        this.$mediaPopup.css("display", "none");
      }
    );

    // if normal video
    let videoElem = this.$mediaPopup.find("video")[0];
    if (videoElem) videoElem.pause();

    //if youtube
    videoElem = this.$mediaPopup.find("iframe")[0];
    if (videoElem && videoElem.contentWindow)
      videoElem.contentWindow.postMessage(
        '{"event":"command","func":"' + "stopVideo" + '","args":""}',
        "*"
      );

    //if vimeo
    const vimeoFrame = this.$mediaPopup.find("iframe[src*='vimeo']")[0];
    if (vimeoFrame) {
      const player = new Vimeo.Player(vimeoFrame);
      player.unload();
    }

    this.fullpage.setAllowScrolling(true, "left, right");
    $(".fp-slidesNav").fadeIn(this.moreInfoFadeTime);
    $("#gridViewButton").fadeIn(this.moreInfoFadeTime);
  }

  createIndex = () => {
    const $index = $("#index-section");
    const numPerPage = jQuery.browser.mobile
      ? 2 * this.projectsNumRows
      : 4 * this.projectsNumRows;

    let $gridPage;
    $(this.projects).each((i, project) => {
      if (i % numPerPage === 0) {
        if ($gridPage !== undefined) $index.append($gridPage);
        $gridPage = $("<div class='gridPage slide'></div>");
      }

      const projectTitle = project.name;
      const projectSubTitle = project.detail;

      const thumbImageUrl = `images/${project.backgroundImage}-500px.jpg`;
      const blurredThumbImageUrl = `images/${project.backgroundImage}-500px-blur.jpg`;

      const itemTags = [];
      for (let tag of project.tags) {
        const $gridtag = $("<div class='gridTag'>" + tag + "</div>");
        //$gridtag.css("background-image", "url(" + blurredThumbImageUrl + ")");
        itemTags.push($gridtag);
      }
      const $gridItem = $("<div class='gridItem'></div>");

      const $gridItemBackground = $(
        `<img class="gridItemBackground" data-src="${thumbImageUrl}"></img>`
      );

      // $gridItemBackground.css("background-image", "url(" + thumbImageUrl + ")");
      const $gridItemBackgroundBlurred = $(
        "<div class='gridItemBackgroundBlurred'></div>"
      );
      $gridItemBackground.on("load", () => {
        $gridItemBackgroundBlurred.fadeOut();
      });

      $gridItemBackgroundBlurred.css(
        "background-image",
        "url(" + blurredThumbImageUrl + ")"
      );

      const $gridItemTitle = $(
        "<div><h1 class='gridItemTitle'>" + projectTitle + "</h1></div>"
      );
      const $gridItemSubTitle = $(
        "<div><h2 class='gridItemSubtitle'>" + projectSubTitle + "</h2></div>"
      );
      const $gridItemTags = $("<div class='gridTags'></div>");

      $gridItemTags.append(itemTags);
      $gridItem.append($gridItemBackground);
      $gridItem.append($gridItemBackgroundBlurred);
      $gridItem.append($gridItemTitle);
      $gridItem.append($gridItemSubTitle);
      $gridItem.append($gridItemTags);
      $gridItem.hover(
        e => {
          $(e.currentTarget)
            .children(".gridItemBackgroundBlurred")
            .fadeIn(150);
        },
        e => {
          $(e.currentTarget)
            .children(".gridItemBackgroundBlurred")
            .fadeOut(150);
        }
      );

      $gridItem.click(() => this.fullpage.moveTo("projects", project.id));

      $gridPage.append($gridItem);
    });

    $index.append($gridPage);
  };

  resize = () => {
    this.width = $("#content").width();
    this.sectionHeight = $("#content").height();

    this.$divsWithBlurredBackgrounds.each((i, elem) => {
      this.setBlurredBackground($(elem));
    });
  };

  updateTransparency = $slide => {
    const $elemsToBlur = $slide.find(
      ".slideHeaders h1, .slideHeaders h2, .slideDescription, .tag, .textBlock"
    );
    $elemsToBlur.each((i, elem) => {
      this.setBlurredBackground($(elem));
    });
  };

  setBlurredBackground = $elem => {
    const $parent = $elem.closest(".slide, .section");
    const $blurredBackgroundImage = $parent.find(
      ".blurredBackgroundImage:first"
    );

    const elemOffsetX = $elem.offset().left - $parent.offset().left;
    const elemOffsetY = $elem.offset().top - $parent.offset().top;

    let backgroundOffsetX = 0;
    let backgroundOffsetY = 0;
    let imgW, imgH;
    const ratio = this.blurImageW / this.blurImageH;
    if (this.width / this.sectionHeight > ratio) {
      imgW = this.width;
      imgH = this.width / ratio;
      backgroundOffsetY = -(imgH - this.sectionHeight) / 2;
    } else {
      imgW = this.sectionHeight * ratio;
      imgH = this.sectionHeight;
      backgroundOffsetX = -(imgW - this.width) / 2;
    }

    let url = $blurredBackgroundImage.attr("src");
    if (!url) url = $blurredBackgroundImage.attr("data-src");
    $elem.css("background", "url('" + url + "')");
    $elem.css("background-size", imgW + "px " + imgH + "px");
    $elem.css(
      "background-position",
      -elemOffsetX +
        backgroundOffsetX +
        "px " +
        (-elemOffsetY + backgroundOffsetY) +
        "px"
    );
  };
}
