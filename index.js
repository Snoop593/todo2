var inputs = document.querySelectorAll('input')
var section = document.querySelector('section')
var item = document.querySelector('.item')
var sort = document.querySelector('.sort')
var er = document.querySelector('.error')
var delButton = document.querySelector('.mulDel')
var globalID = 0;

function App(settings){            //Класс приложения
	this.data = [];                //Хранилище экземпляров
	this.maxSize = settings.maxSize;  //Экземпляров на страницу
	this.state = {                         //Состояние - показывает номер экземпляра, его фильтр, его выделения
		page:0,
		filter:"all",
		select:[]
	};

	this.add = function(list){  // Добавить экземпляр
		if(this.data.length==10000) alert("Больше добавить нельзя")
		else this.data.push(list)        
	}

	this.search = function(name){ //Найти экземпляр
		for(var i=0;i<this.data.length;i++){
			if(this.data[i].name.includes(name)){
				this.state.page=i
				break;
			} 
		}          
	}

	this.delete = function(){  //Удалить текущий экземпляр
		this.data.splice(this.state.page,1)
		this.state.page=0;            
	}

	this.show = function(){  // Отобразить текущий экземпляр
		if(!checkCorrectDate(inputs[0].value)){
			er.innerHTML="Введите корректную дату"
			return
		}
		clear(section)
		if(!this.data.length){
			sort.innerHTML="На данный момент списков задач нет, но вы можете их добавить"
			return
		}
		let events = this.data[this.state.page].data.slice();
		switch(this.state.filter){
			case 'all':{
				sort.innerHTML="Список задач "+this.data[this.state.page].name+", все"
				break;
			}
			case 'active':{
				events = events.filter(function(e){return e.checked===false})
				sort.innerHTML="Список задач "+this.data[this.state.page].name+", активные"
				break;
			}
			case 'completed':{
				events = events.filter(function(e){return e.checked===true})
				sort.innerHTML="Список задач "+this.data[this.state.page].name+", завершенные"
				break;
			}
			case 'allToday':{
				events = events.filter(function(e){return eqDate(checkCorrectDate(inputs[0].value),e.date)})
				sort.innerHTML="Список задач "+this.data[this.state.page].name+", на сегодня"
				break;
			}
		}
		var selectNow = 0;
		events.sort(function(a,b){return a.date-b.date})
		for(var i=0;i<events.length;i++){
			var e = events[i]
			if(i==0 || !eqDate(e.date,events[i-1].date)){
				var d = document.createElement("div")
				d.classList.add('date')
				d.innerHTML = (e.date.getMonth()+1)+"."+e.date.getDate()+"."+e.date.getFullYear();
				d.style.borderBottom = "2px solid black"
				section.appendChild(d)
			}
			var el = document.createElement("div")
			el.addEventListener('click',this.addToMultiDelete,false)
			el.innerHTML = e.name
			el.id = e.id
			var index = app.state.select.indexOf(e.id.toString())
			if(index!=-1){
				el.className+=' selected'
				selectNow++;
			}
			var check = document.createElement("input")
			check.type = "checkbox";
			check.classList.add('check')
			check.checked=e.checked
			if(e.checked)el.className+=' checked'
			check.addEventListener('click',this.changeEvent,false)
			var del = document.createElement("input")
			del.type="button"
			del.value="x"
			del.classList.add('del')
			del.addEventListener('click',this.deleteEvent,false)
			el.appendChild(check)
			el.appendChild(del)
			section.appendChild(el)
		}
		if(selectNow==0) delButton.style.visibility = "hidden"
		else delButton.style.visibility = "visible"
		var len = events.length
		if(len===0)section.innerHTML = "Таких задач нет!"
		item.innerHTML = len+ (len>1 ? " items" : " item")+" left"           
	}

	this.addEvent = function(){  //Добавить событие в экземпляр
		if(!this.data.length){
			er.innerHTML="На данный момент списков задач нет, но вы можете их добавить"
			return
		}
		if(inputs[1].value=="" || inputs[0].value==""){
			er.innerHTML="Заполните поля ввода"
		}
		else if(!checkCorrectDate(inputs[0].value)){
			er.innerHTML="Введите корректную дату"
		}
		else{
			var obj = new Event(globalID++,checkCorrectDate(inputs[0].value),inputs[1].value,false)
			app.data[app.state.page].add(obj)
			inputs[1].value=""
			this.show()
		}      
	}
 
	this.deleteEvent = function(e){ //Удалить событие из экземпляра
		var id;
		if(typeof e!='string'){
			e.stopPropagation()
			id = e.target.parentNode.id
		}
		else id=e
		app.data[app.state.page].delete(id)
		app.show()       
	}
 
	this.changeEvent = function(e){  // Отметить событие в экземпляре
		e.stopPropagation()
		var id = e.target.parentNode.id
		let allow = app.data[app.state.page].change(id)
		app.show()
		var el = document.getElementById(id);
		if(allow) el.className+=' checked'
		else el.className=el.className.replace(' checked','')     
	}
	
	this.multiDeleteEvent = function(){  // Удалить выделенные события в экземпляре
		for(var i=0;i<app.state.select.length;i++){
			var e = app.state.select[i];
			if(document.getElementById(e)){
				this.deleteEvent(e)
				app.state.select.splice(i,1);
				i--
			}
		}
		if(app.state.select.length.length==0) delButton.style.visibility = "hidden"      
	}

	this.addToMultiDelete = function(e){  // Добавить/снять выделение события в экземпляре
		var id = e.target.id
		var index = app.state.select.indexOf(id)
		var el = document.getElementById(id);
		if(index==-1){
			app.state.select.push(id);
			el.className+=' selected'
		}
		else{
			app.state.select.splice(index,1);
			el.className=el.className.replace('selected','')
		}
		if(app.state.select.length>0) delButton.style.visibility = "visible"
		else delButton.style.visibility = "hidden"    
	}
}

function ListEvent(name){        // Класс экземпляра
	this.data = [];
	this.name = name
	this.delete = function(delId){
		for(var j=0;j<this.data.length;j++){
			if(this.data[j].id==delId){
				this.data.splice(j,1);
				break;
			}
		}
	}

	this.add = function(event){
		this.data.push(event)
	}

	this.change = function(chanId){
		for(var j=0;j<this.data.length;j++){
			if(this.data[j].id==chanId){
				this.data[j].checked=!this.data[j].checked
				return this.data[j].checked
			}
		}
	}      
}

function Event(id,date,name,checked){       // Класс события
	this.id = id;
	this.date = date;
	this.name = name;
	this.checked = checked;             
}

function clear(e){          // Функция отчистки для перерисовки
	while(e.firstChild) e.removeChild(e.firstChild);
	item.innerHTML = ""
	sort.innerHTML = ""
	er.innerHTML=""        
}

function eqDate(a,b){    // Функция для сравнения 2ух дат
	a.setHours(0,0,0,0);
	b.setHours(0,0,0,0);
	if(a.getTime()===b.getTime()) return true
	return false    
}

function checkCorrectDate(a){    //Функция проверки корректности введенной даты
	var arr = a.split(/[./:,-]/g);
	var d = new Date()
	d.setFullYear(arr[2]);
	d.setMonth(arr[0]-1);
	d.setDate(arr[1]);
	if(d.getFullYear()==arr[2] && (d.getMonth()+1)==arr[0] && d.getDate()==arr[1]) return d;
	return false        
}


window.onload = function(){    // Чтение из localStorage и заполнение данными приложения, добавление обработчиков событий
	var obj = JSON.parse(localStorage.getItem("lists"))
	if(obj!=null){
		for(var i=0;i<obj.length;i++){
			var list = new ListEvent(obj[i].name)
			for(var j=0;j<obj[i].data.length;j++){
				var ev = new Event(obj[i].data[j].id,new Date(obj[i].data[i].date),obj[i].data[j].name,obj[i].data[j].checked)
				list.add(ev)
			}
			app.add(list)
		}
	}
	var today =  new Date();
	inputs[0].value = (today.getMonth()+1)+"."+today.getDate()+"."+today.getFullYear();
	app.show()
	document.querySelector('#all').addEventListener("click",function(){
		app.state.filter = "all"
		app.show()
	},false)
	document.querySelector('#allToday').addEventListener("click",function(){
		app.state.filter = "allToday"
		app.show()
	},false)
	document.querySelector('#active').addEventListener("click",function(){
		app.state.filter = "active"
		app.show()
	},false)
	document.querySelector('#completed').addEventListener("click",function(){
		app.state.filter = "completed"
		app.show()
	},false)
	document.querySelector('#mulDel').addEventListener("click",function(){
		app.multiDeleteEvent()
		app.show()
	},false)
	document.querySelector('#addEvent').addEventListener("click",function(){
		app.addEvent()
	},false)
	document.querySelector('.plus').addEventListener("click",function(){
		if(inputs[3].value==""){
			er.innerHTML="Введите имя списка"
			return
		}
		app.add(new ListEvent(inputs[3].value))
		app.state.page = app.data.length-1
		app.show()
		inputs[3].value=""
	},false)
	document.querySelector('.arrowLeft').addEventListener("click",function(){
		if(app.state.page==0) app.state.page = app.data.length-1
		else app.state.page--;
		app.show()
	},false)
	document.querySelector('.arrowRigth').addEventListener("click",function(){
		if(app.state.page==app.data.length-1) app.state.page = 0
		else app.state.page++;
		app.show()
	},false)
	document.querySelector('#searchList').addEventListener("input",function(){
		app.search(inputs[2].value)
		app.show()
	},false)
	document.querySelector('.minus').addEventListener("click",function(){
		app.delete()
		app.show()
	},false)        
}
 
window.onunload = function(){            // Запись в localStorage при попытики закрыть/перезагрузить страницу
	localStorage.setItem("lists",JSON.stringify(app.data))
}

var app = new App({maxSize:10000});     //Создание обьекта приложения





