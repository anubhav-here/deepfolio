import initTilt from "./js/tilt";
import initSr from "./js/sr";
import resume from "./assets/resume.pdf";

import "./style/main.scss";

$('a[href^="#"]').on("click", function (event) {
  var target = $(this.getAttribute("href"));
  if (target.length) {
    event.preventDefault();
    $("html, body").stop().animate(
      {
        scrollTop: target.offset().top,
      },
      1000
    );
  }
});

function addResume(pdf) {
  if (!pdf) return;

  // const resumeButton = document.querySelector(".cta-btn--resume");
  // resumeButton.setAttribute("href", pdf);
}

initSr();
initTilt();

// uncomment this if you want to attach your resume
addResume(resume);

$(document).ready(function(){ 
  $(window).scroll(function(){ 
      if ($(this).scrollTop() > 100) { 
          $('#scroll').fadeIn(); 
      } else { 
          $('#scroll').fadeOut(); 
      } 
  }); 
  $('#scroll').click(function(){ 
      $("html, body").animate({ scrollTop: 0 }, 600); 
      return false; 
  }); 
});



/**
 * ---------------------------------------
 * This demo was created using amCharts 4.
 * 
 * For more information visit:
 * https://www.amcharts.com/
 * 
 * Documentation is available at:
 * https://www.amcharts.com/docs/v4/
 * ---------------------------------------
 */

// Themes begin
am4core.useTheme(am4themes_animated);
// Themes end


var chart = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
var series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());

series.accuracy = 4;
series.step = 15;
series.rotationThreshold = 0.7;
series.maxCount = 200;
series.minWordLength = 2;
series.fontFamily = "Helvetica";
series.maxFontSize = am4core.percent(30);

series.text = "Python Python Python Python Python Python Python Python Python Mulesoft Mulesoft Mulesoft Mulesoft Mulesoft Mulesoft Mulesoft RAML RAML RAML RAML RAML RAML API  API API API API API API Dataweave Dataweave Dataweave Dataweave Dataweave Data-Science Data-Science Data-Science Data-Science Data-Science AWS AWS AWS AWS AWS AWS GCP GCP GCP GCP GCP Azure Azure Azure Azure C C C C C C++ C++ C++ C++ C++ C++ Java Java Java Java Java Jmeter Jmeter Jmeter Jmeter Jmeter Jmeter DevOps DevOps DevOps DevOps DevOps DevOps DevOps DevOps kubernetes kubernetes kubernetes kubernetes kubernetes kubernetes  API-Design API-Design API-Design API-Design API-Design API-Design REST REST REST REST REST  golang golang golang golang golang  integrations integrations integrations integrations integrations integrations integrations  RAML HTML HTML HTML HTML HTML  Full-Stack Full-Stack Full-Stack Full-Stack hybrid-cloud hybrid-cloud hybrid-cloud hybrid-cloud hybrid-cloud swagger swagger swagger swagger swagger javascript javascript javascript javascript jenkins jenkins jenkins jenkins jenkins Flask Flask Flask Flask Flask azure-devops azure-devops azure-devops azure-devops azure-devops Ansible Ansible Ansible Ansible Ansible SQL SQL SQL SQL SQL SQL data-visualization data-visualization data-visualization data-visualization data-visualization data-visualization data-visualization "; 





document.addEventListener("DOMContentLoaded", function(){
  window.addEventListener('scroll', function() {
      if (window.scrollY > 1) {
        document.getElementById('navbar_top').classList.add('fixed-top');
        // add padding top to show content behind navbar
        navbar_height = document.querySelector('.navbar').offsetHeight;
        document.body.style.paddingTop = navbar_height + 'px';
      } else {
        document.getElementById('navbar_top').classList.remove('fixed-top');
         // remove padding top from body
        document.body.style.paddingTop = '0';
      } 
  });
}); 