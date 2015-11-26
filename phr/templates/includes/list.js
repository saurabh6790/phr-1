// 	$(document).ready(function () {
// 	// var me= this;
// 	// console.log($(me.document).find("#main-con"))
// 	// var $content=$(me).find("#main-con")
// 	// $("#profile").click(function() {
			
//  //    });

// 	render_image_viewer()
// })

// function render_image_viewer(){
// 	// $("#main-con").html("test image ciewer")
// 	// $("#main-con").html("<div><iframe src='/files/TATA DOCOMO __ Instant Pay.pdf'>myDocument</a</div>")
// 	thumbnail('/files/PatientHealthRecord-SRS.PDF', 'main-con')
// 	$("#main-con").click(function(){
// 		PDFView.initialize();
// 		PDFView.initialBookmark = "page=1";
// 		PDFView.open('/files/PatientHealthRecord-SRS.PDF');
// 	})

// }

function thumbnail(pdfURL, elementID, filename, doc_list, display){
    // console.log(['pdfURL', 'test_pdf', doc_list])
    PDFJS.workerSrc="/assets/phr/pdfjs/build/pdf.worker.js";
    PDFJS.getDocument(pdfURL).then(function(pdf){
        pdf.getPage(1).then(function(page) {  //1 is the page number we want to retrieve
        var viewport = page.getViewport(0.5);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        var renderContext = {
              canvasContext: ctx,
              viewport: viewport
        };

        page.render(renderContext).then(function(){
        //set to draw behind current content
        ctx.globalCompositeOperation = "destination-over";

        //set background color
        ctx.fillStyle = "#ffffff";

        //draw background / rect on entire canvas
        ctx.fillRect(0,0,canvas.width,canvas.height);
        var img = canvas.toDataURL();
        // console.log(img)
        $(elementID).html('<div>\
                            <input type="checkbox" style="display:'+display+'" value="'+pdfURL+'">\
                        </div><a class = "pdf_img" data-name="'+pdfURL+'" ><img style="height:150px;" src="'+img+'"/></a><br>\
                        <label style="width: 150px;word-wrap: break-word;color: #009906;">'+filename+'</label>');

        $('.pdf_img').unbind("click").click(function(){
            window.open($(this).attr('data-name'))
        })

        if(doc_list){
            $.each(doc_list, function(i, val){
                $("input[value='/files/"+val+"']").prop('checked', true);
            })  
        }

        $("input[type=checkbox]").unbind("click").click(function(){
            if($(this).is(':checked')){
                file_path = $(this).val()
                // console.log(file_path)
                doc_list.push(file_path.substring(7, file_path.length))
            }
            else{
                file_path = $(this).val()
                var index = doc_list.indexOf(file_path.substring(7, file_path.length));
                if (index >= 0) {
                    doc_list.splice( index, 1 );
                }
            }
        });
        });

    })

   })

}