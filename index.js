let euro = document.getElementById('euro');
let TND = document.getElementById('TND');
let titre = document.getElementById('titre');
let body = document.body;
titre.style.textAlign = 'center';
euro.onkeyup = function(){
    TND.value = euro.value * 3;
}
TND.onkeyup = function(){
    euro.value = TND.value * 0.3;
}


