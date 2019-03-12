<template>
  <div class="holder" v-on:keyup.left="right" v-on:keyup.right="left">
    <div class="state">
        <h1>{{ state }}</h1>
        <h2 v-if="state!=='Plan'">{{ String(remainingMinutes).padStart(2,0) }} : {{ String(remainingSeconds).padStart(2,0) }}</h2>
        <h2 v-if="state==='Work'">{{ tasks[0] }}</h2>
        <img v-show="state === 'Work' && pomodorosDoneToday().length % 2 === 0" :src="work" width="20%" />
        <img v-show="state === 'Work' && pomodorosDoneToday().length % 2 === 1" :src="work2" width="20%" />
        <img v-show="state === 'Rest'" :src="rest" width="20%" />
        <img v-show="state === 'Plan'" :src="plan" width="20%" />
    </div>

    <div v-if="state==='Plan'" class="todo">
      <ul>
        <li>
            <label for="history">Shown workday {{displayedDate.getDate()}}.{{displayedDate.getMonth()+1}}.{{displayedDate.getFullYear()}}</label>
            <input id="history" type="range" min="-30" max="0" v-model="shownDate" class="slider">
        </li>
        <li>
          <input type="text" v-on:keyup.enter="addTask" v-model="candidateTask">
        </li>
        <li>
          <button v-on:click="addTask">Add task</button>
        </li>
        <li>
          <button v-if="state!=='Work' && tasks.length !== 0 && Number(shownDate) === 0"  v-on:click="startPomodoro">Start Pomodoro</button>
        </li>
      </ul>
    </div>

    <div class="plan" v-if="state==='Plan' && Number(shownDate) === 0">
      <h2>
        Todo-list ({{tasks.length}})
      </h2>
        <ul>
          <li v-for="(task,index) in tasks" v-if="(index < todoTasksShown) || showAllTodo">
              <button
              v-on:keyup.space="startPomodoro"
              v-on:keyup.backspace="clearTask(task)"
              v-on:keyup="keyMonitor"
              v-on:click="completeTask(task)"
              v-on:keyup.up="upTask"
              v-on:keyup.down="downTask"
              >{{task}}</button>
          </li>
        </ul>
        <a v-on:click="toggleShowAllTodo">{{showAllTodo ? 'Hide' : 'Show all'}}</a>
    </div>
    <div class="result"  v-if="state==='Plan'">
      <h2>
        Pomodoros completed: {{pomodorosDoneThatDay}} Tasks completed: {{completedTasksAtShownDay.length}}
      </h2>
      <ul>
        <li v-for="(t,index) in completedTasksAtShownDay" v-if="(index < completedTasksShown) || showAllCompleted">
          <button class="restart" v-on:click="reopenTask" v-on:keyup="keyup">{{t.task}}</button>
        </li>
      </ul>
      <a v-on:click="toggleShowAllCompleted">{{showAllCompleted ? 'Hide' : 'Show all'}}</a>
    </div>
    <div class="slidecontainer" v-if="state==='Plan'">
      <form>
        <fieldset>
          <legend v-on:click="toggleHelp">{{displayHelp ? 'Hide' : 'Settings and Help'}}</legend>
          <div v-if="displayHelp">
            <label for="work">Minutes of work {{workMinutes}}</label>
            <input id="work" type="range" min="1" max="100" v-model="workMinutes" class="slider">
            <label for="rest">Minutes of rest {{restMinutes}}</label>
            <input id="rest" type="range" min="1" max="100" v-model="restMinutes" class="slider">
            <label for="shown">Number of displayed todo tasks {{todoTasksShown}}</label>
            <input id="shown" type="range" min="1" max="50" v-model="todoTasksShown" class="slider">
            <label for="shown">Number of displayed completed tasks {{completedTasksShown}}</label>
            <input id="shown" type="range" min="1" max="50" v-model="completedTasksShown" class="slider">
            <ul class="helplist" align="left">
              <li><b>Up</b> - Move task up (prioritize)</li>
              <li><b>Down</b> - Move task down (deprioritize)</li>
              <li><b>Enter/Space</b> - Mark as completed or reopen</li>
              <li><b>Tab</b> - Move focus to next item</li>
              <li><b>Shift+Tab</b> - Move focus to previous item</li>
              <li><b>Alt</b> - Toggle expand list </li>
            </ul>
          </div>
        </fieldset>
      </form>
    </div>
  </div>

</template>

<script>
import work from "../assets/work.png"
import work2 from "../assets/work2.png"
import rest from "../assets/rest.png"
import plan from "../assets/plan.png"
import sound from "../assets/sound.mp3"



export default {
  name: 'Pomodoro',
  props: {
    startState: String
  },
  watch: {
     restMinutes: function(){
       this.debouncedSaveState();
     },
     workMinutes: function(){
       this.debouncedSaveState();
     },
     todoTasksShown: function(){
       this.debouncedSaveState();
     },
     completedTasksShown: function(){
       this.debouncedSaveState();
     },
     shownDate: function(){
       var date = new Date();
       date.setDate(date.getDate()+Number(this.shownDate))
       this.displayedDate = date;
     }
  },
  created: function(){
    this.debouncedSaveState = _.debounce(this.saveData, 500);
  },
  data: function() {
      return {
        debouncedSaveState: null,
        state: this.startState,
        work: work,
        work2: work2,
        rest: rest,
        plan: plan,
        restMinutes: 5,
        workMinutes: 20,
        remainingMinutes: 0,
        remainingSeconds: 0,
        tasks: [],
        completedTasks: [],
        pomodorosDone: [],
        completedTasksShown: 5,
        todoTasksShown: 5,
        targetDate: new Date(),
        candidateTask: '',
        audio: new Audio(sound),
        displayHelp: false,
        showAllTodo: false,
        showAllCompleted: false,
        displayedDate: new Date(),
        shownDate: 0
      }
  },
  computed: {
    completedTasksAtShownDay: function(){
      var self = this;
      return _.filter(this.completedTasks, function(t){
        return Math.round(self.displayedDate.getTime()/1000/60/60/24) === Math.round(t.completed.getTime()/1000/60/60/24);
      });
    },
    pomodorosDoneThatDay: function(){
      var self = this;
      return _.filter(this.pomodorosDone, function(t){
        return Math.round(self.displayedDate.getTime()/1000/60/60/24) === Math.round(t.getTime()/1000/60/60/24);
      }).length;
    }
  },
  methods: {
      keyMonitor: function(event){
        if(event.key == 'Alt'){
          this.toggleShowAllTodo();
        }
      },
      left: function(event){
        if(event.path[0] && event.path[0].type && (event.path[0].type === 'text' || event.path[0].id==='history')){
          console.log('ignore left when in textfield')
        } else if(this.shownDate < 0){
          this.shownDate = this.shownDate+1;
        }else{
          console.log(this.shownDate)
        }
      },
      right: function(){
        if(event.path[0] && event.path[0].type && (event.path[0].type === 'text' || event.path[0].id==='history')){
          console.log('ignore right when in textfield')
        } else if (this.shownDate > -30){
          this.shownDate = this.shownDate-1;
        }else{
          console.log(this.shownDate)
        }
      },
      keyup: function(event) {
       if(event.key == 'Alt'){
         this.toggleShowAllCompleted();
       }
      },
      pomodorosDoneToday: function(){
        var today = new Date();
        today.setHours(0,0,0,0);
          return _.filter(this.pomodorosDone, function(d){
            var now = new Date(d.getTime());
            now.setHours(0,0,0,0);
            return now.getTime() === today.getTime();
          });
      },
      completedTasksToday: function(){
        var today = new Date();
        today.setHours(0,0,0,0);
          return _.filter(this.completedTasks, function(t){
            var now = new Date(t.completed);
            now.setHours(0,0,0,0);
            return now.getTime() === today.getTime();
          });
      },
      toggleShowAllTodo: function(){
        this.showAllTodo = !this.showAllTodo;
      },
      toggleShowAllCompleted: function(){
        this.showAllCompleted = !this.showAllCompleted;
      },
      toggleHelp: function(){
          this.displayHelp = !this.displayHelp;
      },

      startPomodoro: function(){
        this.state = 'Work';
        this.targetDate = new Date();
        this.targetDate.setMinutes(this.targetDate.getMinutes()+this.workMinutes);
        this.saveData();
        var self = this;
        var timer = setInterval(function(){
          if(new Date() >= self.targetDate){
            self.audio.play();
            if(self.state === 'Work'){
              self.pomodorosDone.push(new Date());
              self.state = 'Rest';
              self.targetDate.setMinutes(self.targetDate.getMinutes()+self.restMinutes);
              self.saveData();
            } else {
              clearInterval(timer)
              self.state = 'Plan';
            }
          }else{
            var distance = self.targetDate - new Date().getTime();
            self.remainingMinutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            self.remainingSeconds = Math.floor((distance % (1000 * 60)) / 1000);
          }
        }, 1000);
      },
      addTask: function(){
        if(this.candidateTask !== ''){
          if(this.tasks.indexOf(this.candidateTask) !== -1){
            alert("Task already exist")
            return;
          }
          this.tasks.reverse();
          this.tasks.push(this.candidateTask);
          this.tasks.reverse();
          this.candidateTask = '';
          this.saveData();
        }
      },
      clearTask: function(i){
        this.tasks.splice(this.tasks.indexOf(i), 1)
        this.saveData();
      },
      completeTask: function(i){
        var index = this.tasks.indexOf(i);
        this.completedTasks.reverse();
        this.completedTasks.push({task: this.tasks.splice(index, 1)[0], completed: new Date()});
        this.completedTasks.reverse();
        this.saveData();
      },
      saveData: function() {
        var state = {
          tasks: this.tasks,
          pomodorosDone: this.pomodorosDone,
          completedTasks: this.completedTasks,
          restMinutes: this.restMinutes,
          workMinutes: this.workMinutes,
          todoTasksShown: this.todoTasksShown,
          completedTasksShown: this.completedTasksShown,
          targetDate: this.targetDate
        }
        const parsed = JSON.stringify(state);
        localStorage.setItem('pomodoroSaveData_0_1', parsed);
        localStorage.removeItem("pomodoroSaveData")
      },
      reopenTask: function(event) {
          const a = this.completedTasks.indexOf(event.target.innerText);
          this.tasks.reverse();
          this.tasks.push(this.completedTasks.splice(a, 1)[0].task)
          this.tasks.reverse();
          this.saveData();
          var openTasksElements = event.target.parentElement.parentElement.parentElement.previousSibling.children[1].children;
          this.$nextTick(function(){
            openTasksElements[0].children[0].focus()
          });
      },
      upTask: function(event) {
          const a = this.tasks.indexOf(event.target.innerText);
          if(a === 0){
            return;
          }
          event.path[1].previousSibling.children[0].focus()
          const b = this.tasks[a];
          this.tasks.splice(a, 1, this.tasks[a-1]);
          this.tasks.splice(a-1, 1, b);
          this.saveData();
      },
      downTask: function(event) {
          const a = this.tasks.indexOf(event.target.innerText);
          if(a === this.tasks.length-1){
            return;
          }
          event.path[1].nextSibling.children[0].focus()
          const b = this.tasks[a];
          this.tasks.splice(a, 1, this.tasks[a+1]);
          this.tasks.splice(a+1, 1, b);
          this.saveData();
      }
  },
  mounted: function() {
    var jsonData00 = localStorage.getItem("pomodoroSaveData")
    var jsonData01 = localStorage.getItem("pomodoroSaveData_0_1")
    if(jsonData00 && ! jsonData01){
      const data = JSON.parse(jsonData00);
      this.tasks = data.tasks;
      this.pomodorosDone = Array(Number(data.pomodorosDone)).fill(new Date());
      this.completedTasks = _.map(data.completedTasks, function(t){
        return {task: t, completed: new Date()}
      });
      this.restMinutes = Number(data.restMinutes),
      this.workMinutes = Number(data.workMinutes),
      this.todoTasksShown = Number(data.todoTasksShown),
      this.completedTasksShown = Number(data.completedTasksShown)
    } else if (jsonData01){
      const data = JSON.parse(jsonData01);
      this.tasks = data.tasks;
      this.pomodorosDone = _.map(data.pomodorosDone, function(s){
        return new Date(s);
      }) || [];
      this.completedTasks = _.map(data.completedTasks, function(t){
        return {task: t.task, completed: new Date(t.completed)}
      }) || [];
      this.restMinutes = Number(data.restMinutes),
      this.workMinutes = Number(data.workMinutes),
      this.todoTasksShown = Number(data.todoTasksShown),
      this.completedTasksShown = Number(data.completedTasksShown)
    }
    this.$nextTick(function(){
      this.displayedDate = new Date();
    });
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.holder{
  margin-left: 20%;
  margin-right: 20%;
  align-content: center;
}
ul{
  padding-inline-start: 0
}
li{
  list-style-type: none;
}
.helplist {
}
h1{
  font-size: 48px;
  font-weight: bold;
}
button {
  background-color: cyan;
  width: 100%;
  border-radius: 10px;
  height: 40px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 3px;
}
button:focus {
  background-color: pink
}
.todo button{
  background-color: lighten(magenta, 40);
  width: 100%
}
.todo button:focus{
  background-color: lighten(magenta, 30);
  width: 100%
}
fieldset {
  border: 0
}
input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  font-size: 18px;
  border-width: thick;
  margin-bottom: 20px;
}
.slidecontainer {
}
</style>
