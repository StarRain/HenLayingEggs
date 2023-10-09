import { _decorator, Collider2D, Component, Contact2DType, Director, director, EventKeyboard, EventTouch, input, Input, instantiate, IPhysics2DContact, KeyCode, Label, Node, Prefab, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
    // 接鸡蛋的桶
    @property(Node) bucket: Node;
    // 鸡蛋容器
    @property(Node) eggsRoot: Node;
    // 鸡蛋预制体
    @property(Prefab) eggPrefab: Prefab;
    // 小鸡容器
    @property(Node) hensRoot: Node;
    // 得分
    @property(Label) scoreLabel: Label;
    // 血量值容器
    @property(Node) heartRoot: Node;
    // 小心心预制体
    @property(Prefab) heartPrefab: Prefab;
    // 游戏结束
    @property(Node) gameOver: Node;
    // 速度
    @property(Label) speedLabel: Label;
    // 连续得分
    @property(Label) maxContinuousLabel: Label;

    // 记录移动生成了多少个鸡蛋
    eggSum = 0;
    // 记录小桶的位置
    bucketIndex = 0;
    // 小鸡的下标(X)
    hensIndexArray = [];
    // 分数
    score = 0;
    // 默认血量值
    defaultHeartCount = 3;
    // 记录最大连击数量
    maxContinuous = 0;
    // 血量值不满时，连击的数量
    continuous = 0;
    // 速度等级
    speedLevel = 0;

    start() {
        this.initData();
        this.initHeart();
        this.startCreateEggs();
        this.inputOnKeyDown();
        this.onTouchEvent();
        this.openCollider2DEvent();
    }
    
    // 初始化数据
    initData() {
        // 获取小鸡容器的长度
        const hensLength = this.hensRoot.children.length;
        // 获取小鸡的下标并存入数组
        for (let i = 0; i < hensLength; i++) {
            const hen = this.hensRoot.children[i];
            this.hensIndexArray[i] = hen.position.x;

        }

        this.bucketIndex = 2;
        this.updateBucketPosition();

        this.gameOver.active = false;
    }

    // 初始化血量值
    initHeart() {
        for(let i = 0; i < this.defaultHeartCount; i++) {
            this.createHeart();
        }
    }

    // 创建一个小心心
    createHeart() {
        const heart = instantiate(this.heartPrefab);
        this.heartRoot.insertChild(heart, 0);
    }

    // 扣除一个小心心
    destroyHeart() {
        // 扣除一个小心心
        this.heartRoot.children[this.heartRoot.children.length - 1].destroy();
        // 重置连击数量
        this.maxContinuous = 0;
        this.maxContinuousLabel.string = '连击 x 0';
        this.continuous = 0;
    }

    // 更新血量值
    addHeart() {
        const heartLength = this.heartRoot.children.length;
        if(heartLength >= this.defaultHeartCount || this.continuous < 5) {
            return;
        }
        // 当血量值低于[defaultHeartCount],每连续接住5次就增加一个小心心
        this.createHeart();
        // 重置连击数量
        this.continuous = 0;
    }

    // 开始创建鸡蛋
    startCreateEggs() {
        this.createOneEgg();
        this.schedule(this.createOneEgg, 1);
    }

    // 创建一个鸡蛋对象
    createOneEgg() {
        // 创建一个鸡蛋实例
        const egg = instantiate(this.eggPrefab);
        // 将创建的鸡蛋实例添加到鸡蛋容器
        this.eggsRoot.addChild(egg);
        // 随机一个相对于小鸡位置的鸡蛋下标
        const randomIndex = Math.floor(Math.random() * this.hensRoot.children.length);
        // 设置鸡蛋的位置
        egg.setPosition(this.hensIndexArray[randomIndex], this.hensRoot.position.y);

        // 更新创建鸡蛋的数量
        this.eggSum += 1;

        // 没创建5个鸡蛋速度等级 + 1
        this.speedLevel = Math.floor(this.eggSum / 5);
        this.speedLabel.string = `速度 x ${this.speedLevel + 1}`

        // 调整鸡蛋创建速度
        if(this.eggSum % 10 == 0) {
            this.unschedule(this.createOneEgg);
            this.schedule(this.createOneEgg, 1 / Math.floor(this.eggSum / 10));
        }
    }

    // 监听键盘输入事件
    inputOnKeyDown() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this); 
    }

    // 监听键盘按键操作
    onKeyDown(event: EventKeyboard) {
        switch(event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                // 向左移动
                this.moveBucket(-1);
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                // 向右移动
                this.moveBucket(1);
                break;
        }
    }

    // 根据键盘输入事件移动小桶的位置
    moveBucket(dir: 1 | -1) {
        this.bucketIndex += dir;

        if(this.bucketIndex < 0) {
            this.bucketIndex = 0;
        }

        if(this.bucketIndex >= this.hensIndexArray.length) {
            this.bucketIndex = this.hensIndexArray.length - 1;
        }

        this.updateBucketPosition();
    }

    // 监听滑动事件
    onTouchEvent() {
        this.bucket.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            // 获取当前节点移动的数值
            const delta = event.getUIDelta();
            const deltaX = delta.x;
            const deltaY = delta.y;

            // 获取当前节点在720*1080上的坐标
            const x = this.bucket.position.x;
            const y = this.bucket.position.y;

            // 修改当前节点在720*1080上的坐标
            this.bucket.setPosition(x + deltaX, y);
        }, this);
    }

    // 更新小桶的位置
    updateBucketPosition() {
        const bucketX = this.hensIndexArray[this.bucketIndex];
        const bucketY = this.bucket.position.y;
        this.bucket.setPosition(bucketX, bucketY);
    }

    // 监听碰撞事件
    openCollider2DEvent() {
        const comp = this.bucket.getComponent(Collider2D);
        comp.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    // 开始碰撞回调
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        this.score += 1;
        this.updateScore();
        // 更新连击数量
        this.maxContinuous += 1;
        this.maxContinuousLabel.string = `连击 x ${this.maxContinuous}`;
        if(this.heartRoot.children.length < this.defaultHeartCount) {
            this.continuous += 1;
            this.addHeart();
        }
        
        director.once(Director.EVENT_AFTER_PHYSICS, () => {
            otherCollider.node.destroy();
        }, this);
    }

    // 更新分数
    updateScore() {
        this.scoreLabel.string = `${this.score} 分`;
    }

    // 展示游戏结束
    showGameOver() {
        this.gameOver.active = true;
    }

    update(deltaTime: number) {
        for(let i = 0; i < this.eggsRoot.children.length; i++) {
            const egg = this.eggsRoot.children[i];
            const eggX = egg.position.x;
            const eggY = egg.position.y - 200 * deltaTime - this.speedLevel * 50 * deltaTime;
            egg.setPosition(eggX, eggY);

            // 销毁
            if(eggY < -600) {
                egg.destroy();

                if(this.heartRoot.children.length > 1) {
                    this.destroyHeart();
                } else {
                    // 游戏结束
                    this.destroyHeart();
                    this.unschedule(this.createOneEgg);
                    this.eggsRoot.removeAllChildren();
                    this.showGameOver();
                }
            }
        }
    }
}

