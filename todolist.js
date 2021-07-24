//Select the Elements
const clear = document.querySelector(".clear");
const dateElement = document.getElementById("date");
const list = document.getElementById("list");
const input = document.getElementById("input");
//Classes Names
const CHECK = "fa-check-circle";
const UNCHECK = "fa-circle-thin";
const LINE_THROUGH ="linethrough";

// Variables
let LIST, id;

//get item from localstorage
let data = localStorage.getItem("TODO");

// check if data is not empty
if(data){
  LIST = JSON.parse(data);
  id = LIST.length; // set the id to the last one in the list
  loadList(LIST); // load the list to the user interface
}else{
     // if data isnt empty
     LIST = [];
     id = 0;
}

// load items to the user's interface
function loadList(array){
    array.forEach(function(item){
        addToDo(item.name, item.id, item.done, item.trash);
    });
}

//clear the local storage
clear.addEventListener("click", function(){
    localStorage.clear();
    location.reload();
})

// Show todays date
const options = {weekday : "long", month:"short", day:"numeric"};
const today= new Date();

dateElement.innerHTML = today.toLocaleDateString("en-US", options);

function addToDo(toDo ,id,done, trash){
    if(trash){ return;}
    
    const DONE = done ? CHECK : UNCHECK;
    const LINE = done ? LINE_THROUGH : "";
    
    const item = `
    <i class="fa ${DONE} co"  job="complete" id="${id}"></i>
    <p class="text ${LINE}"> ${toDo}  </p>
    <i class="fa fa-trash-o de" job="delete" id="${id}"></i>
    </li>
    `;
     
    const postion = "beforeend"

    list.insertAdjacentHTML(position, item);

}

// add an item to the list user enter the key
document.addEventListener("keyup",function(even){
    if(event.keyCode == 13){
        const toDo = input.value;

        // if the input inst empty
        if(toDo){
             addToDo(toDo);

             LIST.push({
                 name: toDo,
                 id : id,
                 done: false,
                 trash: false
             });

             // add item to localstorage(this code must be added where)
        localStorage.setItem("TODO", JSON.stringify(LIST));
             id++;
        }
        input.value = "";
    }
        
});

// complete to do
function completeToDo(element){
    element.classList.toggle(CHECK);
    element.classList.toggle(UNCHECK);
    element.parentNode.querySelector(".text").classList.toggle(LINE_THROUGH)

    LIST[element.id].done =LIST[element.id].done ? false : true;
}

function removeToDo(element){
    element.parentNode.parentNode.removeChild(element.parentNode;
    
    LIST[element,id].trash = true;
}

// target the items created dynamically

list.addEvemtListner("click", function(event){
    const element = event.target;//return the clicked element inside line
    const elementJob = element.attributes.job.value;// complete or delete

    if(elementJob == "complete"){
        completeToDo(element);
    }else if(elementJob == "delete"){
         removeToDo(element);
    }
localStorage.setItem("TODO", JSON.stringify(LIST));
});

addToDo("Coffee", i, false, true);

  if(trash){ return;}

    const DONE = done ? CHECK: UNCHECK;
    const LINE = done ? LINE_THROUGH: "";

    const text = `<li class="item">
              <i class="fa ${DONE}"  complete job="complete" id="${id}"></i>
              <p class="text ${LINE}"> ${toDo}  </p>
              <i class="do fa fa-trash-o" job="delete" id="${id}"></i>
              </li>`;
    
    const position= "beforeend";
      
    list.insertAdjacentHTML(position, text);
}

funtion completeToDo(element){
    element.classList.toggle(CHECK);
    element.classList.toggle(UNCHECK);
    element.parentNode.querySelector(".text").classList.toggle(LINE_THROUGH);
                   LIST[element.id].done? false : true
}
          
                     LIST[0]: {item : "Drink coffee",
                                id  : 0,
                                done : false,
                                trash : false   
                                 }


addToDo("Drink Coffee");
