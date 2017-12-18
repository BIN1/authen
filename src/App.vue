<template>
    <div id="app">
            <router-view></router-view>
    </div>
</template>
<script>
    export default {
        name: 'app',
        components:{
        },
        data(){
            return{
                facility:false
            }
        },
        
        created(){
            document.addEventListener('deviceready', function () {

            }, false);
        },
        methods:{
            
        },
        
    };
</script>
<style lang="less">
@import '~vux/src/styles/reset.less';
</style>

