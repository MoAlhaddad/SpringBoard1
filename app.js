let topTextinput, bottomTextinput, imageInput, generatebtn, canvas, ctx;

function generateMeme (img) {
    canvas.width = img.width;
    canvas.height = img.heigh;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0,)

    let fontSize = canvas.width/ 15;
    ctx.font = fontSize = 'px impact';
    ctx.fillstyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 15;
    ctx.textAlign = 'center';

    ctx.textBaseline = 'top';
    topText.split('\n').forEach(function(t, i) {
       ctx.fillText(t, canvas.width / 2, i * fontSize, canvas.width);
       ctx.strokeText(t, canvas.width / 2, i * fontSize, canvas.width);
    });

    ctx.textBaseline = 'bottom';
    bottomText.split('\n').reverse.forEach(function(t, i) {
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - i * fontSize, canvas.width);
        ctx.strokeText(bottomText, canvas.width / 2, canvas.height - i * fontSize, canvas.width);

}

 ,function init () {
    topTextinput = document.getElementById("top-text");
    bottomTextinput = document.getElementById("bottom-text");
    imageInput = document.getElementById('image-Input');
    generatebtn = document.getElementById('generate-btn');
    canvas = document.getElementById('meme-canvas');

    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 0;

    generatebtn.addEventListener('click', function(){
        let reader = new fileReader();
        reader.onload= function (){
            let img = new Image;
            img.src = reader.result
            generateMeme(img);
        }
        reader.readasDataUrl(imageInput.files[0]);
    });
    init();
}

