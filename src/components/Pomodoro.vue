<template>
  <div class="holder">
    <div class="state">
        <h1>{{ state }}</h1>
        <h2 v-if="state!=='Plan'">{{ String(remainingMinutes).padStart(2,0) }} : {{ String(remainingSeconds).padStart(2,0) }}</h2>
        <h2 v-if="state==='Work'">{{ tasks[0] }}</h2>
        <img v-show="state === 'Work'" :src="work" width="20%" />
        <img v-show="state === 'Rest'" :src="rest" width="20%" />
        <img v-show="state === 'Plan'" :src="plan" width="20%" />
    </div>

    <div v-if="state==='Plan'" class="todo">
      <ul>
        <li>
          <input type="text" v-on:keyup.enter="addTask" v-model="candidateTask">
        </li>
        <li>
          <button v-on:click="addTask">Add task</button>
        </li>
        <li>
          <button v-if="state!=='Work' && tasks.length !== 0"  v-on:click="startPomodoro">Start Pomodoro</button>
        </li>
      </ul>
    </div>

    <div class="plan" v-if="state==='Plan'">
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
        Pomodoros completed: {{pomodorosDone}} Tasks completed: {{completedTasks.length}}
      </h2>
      <ul>
        <li v-for="(t,index) in completedTasks" v-if="(index < completedTasksShown) || showAllCompleted">
          <button class="restart" v-on:click="reopenTask" v-on:keyup="keyup">{{t}}</button>
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
import rest from "../assets/rest.png"
import plan from "../assets/plan.png"
import sound from "../assets/sound.mp3"



export default {
  name: 'Pomodoro',
  props: {
    startState: String
  },
  data: function() {
      return {
        state: this.startState,
        work: work,
        rest: rest,
        plan: plan,
        restMinutes: 5,
        workMinutes: 20,
        remainingMinutes: 0,
        remainingSeconds: 0,
        tasks: [],
        completedTasks: [],
        pomodorosDone: 0,
        completedTasksShown: 5,
        todoTasksShown: 5,
        targetDate: new Date(),
        candidateTask: '',
        audio: new Audio(sound),
        displayHelp: false,
        showAllTodo: false,
        showAllCompleted: false
      }
  },
  methods: {
    keyMonitor: function(event){
      if(event.key == 'Alt'){
        this.toggleShowAllTodo();
      }
    },
      keyup: function(event) {
       if(event.key == 'Alt'){
         this.toggleShowAllCompleted();
       }
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
          if(new Date() > self.targetDate){
            self.audio.play();
            if(self.state === 'Work'){
              self.pomodorosDone += 1;
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
        this.completedTasks.push(this.tasks.splice(index, 1)[0]);
        this.completedTasks.reverse();
        this.saveData();
      },
      saveData: function() {
        const parsed = JSON.stringify({tasks: this.tasks, pomodorosDone: this.pomodorosDone, completedTasks: this.completedTasks, targetDate: this.targetDate});
        localStorage.setItem('pomodoroSaveData', parsed);
      },
      reopenTask: function(event) {
          const a = this.completedTasks.indexOf(event.target.innerText);
          this.tasks.push(this.completedTasks.splice(a, 1)[0])
          this.saveData();
          var openTasksElements = event.target.parentElement.parentElement.parentElement.previousSibling.children[1].children;
          this.$nextTick(function(){
            openTasksElements[openTasksElements.length-1].children[0].focus()
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
    var jsonData = localStorage.getItem("pomodoroSaveData")
    if(jsonData){
      const data = JSON.parse(jsonData);
      this.tasks = data.tasks;
      this.pomodorosDone = data.pomodorosDone;
      this.completedTasks = data.completedTasks;
    }
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
