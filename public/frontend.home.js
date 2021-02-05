let limit = 7
let html

$(document).ready(()=>{
    $(".delete-post").on("click",function(){
        let parent = $(this).parent().attr('id')
        $.ajax({
            type: "POST",
            url: "/deletepost",
            data: JSON.stringify({postId: parent}),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                console.log(response.postId)
                //hides the post in the browser
                $("#"+response.postId).hide()
                
                
            },
            async: false
        });
    })
    $("#show-more").on("click", function (e) {
        limit = limit + 5
        $.ajax({
            type: "POST",
            url: "/getposts",
            data: JSON.stringify({limit: limit}),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                
                let posts = response.posts
                let owner = response.owner
                $(".posts").empty()
                console.log(posts)
                console.log(owner)
                for(i=0; i<posts.length; i++) {
                    
                    html = "<div class='border border-gray-400 w-10/12 p-5 rounded mt-4 shadow-lg' id='"+posts[i].postId+"'><h3 class='text-xl font-semibold'>"+posts[i].formattedTime+"<span class='font-normal text-gray-800'> "+posts[i].description+"</span></h3><h3 class='text-gray-500'>- "+posts[i].userName+"</h3>"
                    if(posts[i].imgName){
                        if(posts[i].isImg){
                            html = html.concat("<img src='uploads/"+posts[i].imgName+"' alt='' class=' mt-3'>")
                        }else{
                            html = html.concat("<video  controls preload='metadata'poster='uploads/"+posts[i].imgName+"' class=' mt-3'><source src='uploads/"+posts[i].imgName+"' type='video/mp4'></video>")
                        }
                    }
                    if(owner){
                        html = html.concat("<h3 class='text-red-600 cursor-pointer select-none delete-post'>Delete</h3>")
                    }
                    html = html.concat("</div>")
                    $(".posts").append(html)
                }
                
            },
            async: false
        });

    })
})

