var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}


//#####TRYING TO REFRESH TABS no luck =================================
    // $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
    //     localStorage.setItem('activeTab', $(e.target).attr('href'));
    // });
    // var activeTab = localStorage.getItem('activeTab');
    // if(activeTab){
    //     $('#tabslist a[href="' + activeTab + '"]').tab('show'); 
    //     console.log("activate - ", activeTab);
    // }
 $('#exp2-tab-link').click(function() {
  location.reload();
//    $('#tabslist a[href="' + activeTab + '"]').tab('show');  
//    $('#tabslist a[href="#tab-exp2"]').tab('show');  
 console.log("showed 2");
 });
 $('#exp1-tab-link').click(function() {

    $('#tabslist a[href="#tab-exp1"]').location.reload();  
 console.log("showed 1");
 });
 $('#exp3-tab-link').click(function() {
  location.reload();
//    $('#tabslist a[href="#tab-exp3"]').tab('show');  
 console.log("showed 3");
 });
 // $('#exp1-tab-link').click(function() {
 // location.reload();
 // });
////////////////////////////////////////////////////////////////////