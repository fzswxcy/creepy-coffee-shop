import { _decorator, Component, Node, director, Prefab, instantiate, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager } from '../core/EventManager';
import { Customer } from './Customer';
import { CoffeeMachine } from './CoffeeMachine';
import { UIManager } from '../ui/UIManager';

const { ccclass, property } = _decorator;

/**
 * 主场景控制器
 * 负责主场景的游戏逻辑：顾客生成、咖啡机管理、资源管理等
 */
@ccclass('MainSceneController')
export class MainSceneController extends Component {
    
    // 预制体引用
    @property(Prefab)
    customerPrefab: Prefab = null;  // 顾客预制体
    
    @property(Prefab)
    coffeeMachinePrefab: Prefab = null;  // 咖啡机预制体
    
    // 生成位置
    @property(Node)
    customerSpawnPoints: Node[] = [];  // 顾客生成点
    
    @property(Node)
    machinePositions: Node[] = [];  // 咖啡机位置
    
    @property(Node)
    customerContainer: Node = null;  // 顾客容器
    
    @property(Node)
    machineContainer: Node = null;  // 咖啡机容器
    
    // 游戏参数
    @property
    maxCustomers: number = 5;  // 最大顾客数
    
    @property
    customerSpawnInterval: number = 10;  // 顾客生成间隔（秒）
    
    @property
    initialMachines: number = 2;  // 初始咖啡机数量
    
    @property
    maxMachines: number = 5;  // 最大咖啡机数量
    
    // 私有变量
    private _activeCustomers: Map<string, Customer> = new Map();
    private _activeMachines: Map<string, CoffeeMachine> = new Map();
    private _customerSpawnTimer: number = 0;
    private _totalCoins: number = 0;
    private _totalScore: number = 0;
    private _dayTime: number = 0;  // 游戏内时间（秒）
    private _dayNumber: number = 1;  // 天数
    private _isSceneReady: boolean = false;
    
    onLoad() {
        this.initScene();
        this.setupEventListeners();
    }
    
    /**
     * 初始化场景
     */
    private initScene() {
        console.log('初始化主场景');
        
        // 初始化游戏数据
        this._totalCoins = 100;  // 初始金币
        this._totalScore = 0;
        this._dayTime = 0;
        this._dayNumber = 1;
        
        // 生成初始咖啡机
        this.spawnInitialMachines();
        
        // 场景准备完成
        this._isSceneReady = true;
        
        // 发送场景准备完成事件
        EventManager.instance.emit('scene_ready');
        
        console.log('主场景初始化完成');
    }
    
    /**
     * 设置事件监听
     */
    private setupEventListeners() {
        // 游戏事件
        EventManager.instance.on(EventManager.Events.GAME_START, this.onGameStart, this);
        EventManager.instance.on(EventManager.Events.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.on(EventManager.Events.GAME_RESUMED, this.onGameResumed, this);
        EventManager.instance.on(EventManager.Events.GAME_END, this.onGameEnd, this);
        
        // 顾客事件
        EventManager.instance.on(EventManager.Events.CUSTOMER_ARRIVED, this.onCustomerArrived, this);
        EventManager.instance.on(EventManager.Events.CUSTOMER_SERVED, this.onCustomerServed, this);
        EventManager.instance.on(EventManager.Events.CUSTOMER_LEFT, this.onCustomerLeft, this);
        EventManager.instance.on(EventManager.Events.CUSTOMER_ANGRY, this.onCustomerAngry, this);
        
        // 咖啡事件
        EventManager.instance.on(EventManager.Events.COFFEE_PRODUCED, this.onCoffeeProduced, this);
        EventManager.instance.on(EventManager.Events.COFFEE_SOLD, this.onCoffeeSold, this);
        
        // 数据事件
        EventManager.instance.on(EventManager.Events.COINS_CHANGED, this.onCoinsChanged, this);
        EventManager.instance.on(EventManager.Events.SCORE_CHANGED, this.onScoreChanged, this);
        
        // 广告事件
        EventManager.instance.on(EventManager.Events.AD_REWARD, this.onAdReward, this);
        
        // 微恐事件
        EventManager.instance.on('customer_scared', this.onCustomerScared, this);
        EventManager.instance.on('coffee_machine_broken', this.onMachineBroken, this);
    }
    
    /**
     * 生成初始咖啡机
     */
    private spawnInitialMachines() {
        for (let i = 0; i < Math.min(this.initialMachines, this.machinePositions.length); i++) {
            this.spawnCoffeeMachine(i);
        }
    }
    
    /**
     * 生成咖啡机
     * @param index 位置索引
     */
    private spawnCoffeeMachine(index: number): CoffeeMachine {
        if (!this.coffeeMachinePrefab || index >= this.machinePositions.length) {
            console.error('无法生成咖啡机：预制体不存在或位置索引无效');
            return null;
        }
        
        const machineNode = instantiate(this.coffeeMachinePrefab);
        machineNode.parent = this.machineContainer || this.node;
        machineNode.position = this.machinePositions[index].position.clone();
        
        const machine = machineNode.getComponent(CoffeeMachine);
        if (machine) {
            machine.machineLevel = 1;
            machine.coffeeType = this.getRandomCoffeeType();
            machine.coffeeValue = this.calculateCoffeeValue(machine.coffeeType);
            
            this._activeMachines.set(machineNode.uuid, machine);
            
            // 发送机器生成事件
            EventManager.instance.emit('coffee_machine_spawned', {
                machineId: machineNode.uuid,
                position: machineNode.position,
                type: machine.coffeeType,
                level: machine.machineLevel
            });
            
            console.log(`生成咖啡机: ${machine.coffeeType}, 位置: ${index}`);
        }
        
        return machine;
    }
    
    /**
     * 获取随机咖啡类型
     */
    private getRandomCoffeeType(): string {
        const coffeeTypes = ['espresso', 'latte', 'cappuccino', 'mocha', 'americano'];
        return coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
    }
    
    /**
     * 计算咖啡价值
     */
    private calculateCoffeeValue(coffeeType: string): number {
        const valueMap = {
            'espresso': 10,
            'latte': 15,
            'cappuccino': 20,
            'mocha': 25,
            'americano': 8
        };
        return valueMap[coffeeType] || 10;
    }
    
    /**
     * 生成顾客
     */
    private spawnCustomer(): Customer {
        if (!this.customerPrefab || this._activeCustomers.size >= this.maxCustomers) {
            return null;
        }
        
        // 获取可用生成点
        const availableSpots = this.getAvailableCustomerSpots();
        if (availableSpots.length === 0) {
            return null;
        }
        
        // 随机选择一个位置
        const spotIndex = Math.floor(Math.random() * availableSpots.length);
        const spawnSpot = availableSpots[spotIndex];
        
        // 创建顾客
        const customerNode = instantiate(this.customerPrefab);
        customerNode.parent = this.customerContainer || this.node;
        customerNode.position = spawnSpot.position.clone();
        
        const customer = customerNode.getComponent(Customer);
        if (customer) {
            // 随机设置顾客属性
            const randomCustomer = Customer.createRandomCustomer();
            customer.customerType = randomCustomer.type;
            customer.orderType = randomCustomer.order;
            customer.patienceTime = randomCustomer.patience;
            
            // 到达座位
            const seatPos = this.getCustomerSeatPosition(spawnSpot);
            customer.arrive(seatPos);
            
            this._activeCustomers.set(customerNode.uuid, customer);
            
            console.log(`生成顾客: ${customer.customerType}, 订单: ${customer.orderType}`);
        }
        
        return customer;
    }
    
    /**
     * 获取可用的顾客生成点
     */
    private getAvailableCustomerSpots(): Node[] {
        const availableSpots: Node[] = [];
        
        for (const spot of this.customerSpawnPoints) {
            // 检查该位置是否已有顾客
            let isOccupied = false;
            for (const customer of this._activeCustomers.values()) {
                const customerPos = customer.node.position;
                const spotPos = spot.position;
                const distance = Vec3.distance(customerPos, spotPos);
                
                if (distance < 50) {  // 如果距离太近，认为位置被占用
                    isOccupied = true;
                    break;
                }
            }
            
            if (!isOccupied) {
                availableSpots.push(spot);
            }
        }
        
        return availableSpots;
    }
    
    /**
     * 获取顾客座位位置
     */
    private getCustomerSeatPosition(spawnSpot: Node): Vec3 {
        // 这里可以根据生成点计算座位位置
        // 暂时返回生成点前方一点的位置
        return new Vec3(
            spawnSpot.position.x + 100,
            spawnSpot.position.y,
            spawnSpot.position.z
        );
    }
    
    /**
     * 服务顾客
     * @param customerId 顾客ID
     * @param coffeeType 咖啡类型
     */
    public serveCustomer(customerId: string, coffeeType: string): boolean {
        const customer = this._activeCustomers.get(customerId);
        if (!customer || !customer.isWaiting()) {
            return false;
        }
        
        customer.serve(coffeeType);
        return true;
    }
    
    /**
     * 购买新咖啡机
     */
    public buyNewMachine(): boolean {
        if (this._activeMachines.size >= this.maxMachines) {
            console.log('已达到最大咖啡机数量');
            return false;
        }
        
        const cost = 500;  // 购买价格
        if (this._totalCoins < cost) {
            console.log('金币不足');
            return false;
        }
        
        // 扣款
        this.addCoins(-cost);
        
        // 找到空位置
        for (let i = 0; i < this.machinePositions.length; i++) {
            const position = this.machinePositions[i];
            let isOccupied = false;
            
            for (const machine of this._activeMachines.values()) {
                const machinePos = machine.node.position;
                const spotPos = position.position;
                const distance = Vec3.distance(machinePos, spotPos);
                
                if (distance < 10) {
                    isOccupied = true;
                    break;
                }
            }
            
            if (!isOccupied) {
                this.spawnCoffeeMachine(i);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 升级咖啡机
     * @param machineId 咖啡机ID
     */
    public upgradeMachine(machineId: string): boolean {
        const machine = this._activeMachines.get(machineId);
        if (!machine) {
            return false;
        }
        
        const cost = machine.getUpgradeCost();
        if (this._totalCoins < cost) {
            return false;
        }
        
        // 扣款
        this.addCoins(-cost);
        
        // 升级机器
        machine.upgrade();
        return true;
    }
    
    /**
     * 维修咖啡机
     * @param machineId 咖啡机ID
     */
    public repairMachine(machineId: string): boolean {
        const machine = this._activeMachines.get(machineId);
        if (!machine || !machine.isBroken()) {
            return false;
        }
        
        const cost = machine.getRepairCost();
        if (this._totalCoins < cost) {
            return false;
        }
        
        // 扣款
        this.addCoins(-cost);
        
        // 维修机器
        machine.repair();
        return true;
    }
    
    /**
     * 添加金币
     * @param amount 数量
     */
    public addCoins(amount: number): void {
        this._totalCoins += amount;
        
        EventManager.instance.emit(EventManager.Events.COINS_CHANGED, {
            amount,
            total: this._totalCoins,
            source: 'gameplay'
        });
        
        console.log(`金币变化: ${amount > 0 ? '+' : ''}${amount}, 总计: ${this._totalCoins}`);
    }
    
    /**
     * 添加分数
     * @param amount 数量
     */
    public addScore(amount: number): void {
        this._totalScore += amount;
        
        EventManager.instance.emit(EventManager.Events.SCORE_CHANGED, {
            amount,
            total: this._totalScore
        });
    }
    
    /**
     * 游戏开始事件处理
     */
    private onGameStart(data: any): void {
        console.log('主场景：游戏开始');
        this._customerSpawnTimer = this.customerSpawnInterval;
    }
    
    /**
     * 游戏暂停事件处理
     */
    private onGamePaused(): void {
        console.log('主场景：游戏暂停');
    }
    
    /**
     * 游戏恢复事件处理
     */
    private onGameResumed(): void {
        console.log('主场景：游戏恢复');
    }
    
    /**
     * 游戏结束事件处理
     */
    private onGameEnd(data: any): void {
        console.log('主场景：游戏结束');
        this.cleanupScene();
    }
    
    /**
     * 顾客到达事件处理
     */
    private onCustomerArrived(data: any): void {
        // 可以在这里更新UI显示
    }
    
    /**
     * 顾客服务事件处理
     */
    private onCustomerServed(data: any): void {
        if (data.isCorrect) {
            // 正确服务，获得奖励
            this.addCoins(data.reward);
            this.addScore(data.reward * 10);
            
            // 微恐效果：如果服务了幽灵顾客，可能有特殊效果
            if (data.customerType === 'ghost') {
                this.triggerGhostEffect();
            }
        } else {
            // 错误服务，惩罚
            this.addCoins(-5);
            
            // 微恐效果：给错咖啡可能吓到顾客
            EventManager.instance.emit('customer_wrong_coffee', data);
        }
    }
    
    /**
     * 顾客离开事件处理
     */
    private onCustomerLeft(data: any): void {
        // 从活动列表中移除顾客
        if (this._activeCustomers.has(data.customerId)) {
            this._activeCustomers.delete(data.customerId);
        }
    }
    
    /**
     * 顾客生气事件处理
     */
    private onCustomerAngry(data: any): void {
        // 微恐效果：生气的顾客可能吓到其他顾客
        this.scareNearbyCustomers(data.customerId);
    }
    
    /**
     * 顾客被吓事件处理
     */
    private onCustomerScared(data: any): void {
        // 微恐效果：播放吓人音效、特效等
        EventManager.instance.emit('play_scare_effect', data);
    }
    
    /**
     * 咖啡生产事件处理
     */
    private onCoffeeProduced(data: any): void {
        // 可以在这里更新生产统计
    }
    
    /**
     * 咖啡销售事件处理
     */
    private onCoffeeSold(data: any): void {
        // 咖啡生产完成，可以销售给顾客
        this.tryAutoServeCustomer(data.type, data.value);
    }
    
    /**
     * 机器损坏事件处理
     */
    private onMachineBroken(data: any): void {
        // 微恐效果：损坏的机器可能有恐怖特效
        EventManager.instance.emit('play_machine_broken_effect', data);
    }
    
    /**
     * 金币变化事件处理
     */
    private onCoinsChanged(data: any): void {
        // 更新UI显示
        UIManager.instance.updateUIData(UIManager.PanelType.MAIN, {
            coins: data.total
        });
    }
    
    /**
     * 分数变化事件处理
     */
    private onScoreChanged(data: any): void {
        // 更新UI显示
        UIManager.instance.updateUIData(UIManager.PanelType.MAIN, {
            score: data.total
        });
    }
    
    /**
     * 广告奖励事件处理
     */
    private onAdReward(data: any): void {
        // 处理广告奖励
        switch (data.rewardType) {
            case 'double_coins':
                this._totalCoins *= 2;
                break;
            case 'free_machine':
                this.buyNewMachine();
                break;
            case 'instant_repair':
                this.repairAllMachines();
                break;
        }
    }
    
    /**
     * 尝试自动服务顾客
     */
    private tryAutoServeCustomer(coffeeType: string, value: number): void {
        // 寻找等待该类型咖啡的顾客
        for (const customer of this._activeCustomers.values()) {
            if (customer.isWaiting() && customer.getOrderType() === coffeeType) {
                this.serveCustomer(customer.node.uuid, coffeeType);
                break;
            }
        }
    }
    
    /**
     * 吓唬附近的顾客
     */
    private scareNearbyCustomers(sourceCustomerId: string): void {
        const sourceCustomer = this._activeCustomers.get(sourceCustomerId);
        if (!sourceCustomer) return;
        
        const sourcePos = sourceCustomer.node.position;
        
        for (const customer of this._activeCustomers.values()) {
            if (customer.node.uuid === sourceCustomerId) continue;
            
            const customerPos = customer.node.position;
            const distance = Vec3.distance(sourcePos, customerPos);
            
            if (distance < 150) {  // 150像素范围内的顾客可能被吓到
                if (Math.random() < 0.3) {  // 30%概率
                    // 微恐效果：传递恐惧
                    EventManager.instance.emit('customer_scare_propagate', {
                        source: sourceCustomerId,
                        target: customer.node.uuid,
                        distance: distance
                    });
                }
            }
        }
    }
    
    /**
     * 触发幽灵效果
     */
    private triggerGhostEffect(): void {
        // 幽灵顾客的特殊效果
        EventManager.instance.emit('ghost_effect', {
            type: 'served_ghost',
            time: Date.now()
        });
        
        // 可能触发恐怖事件
        if (Math.random() < 0.2) {
            this.triggerHorrorEvent();
        }
    }
    
    /**
     * 触发恐怖事件
     */
    private triggerHorrorEvent(): void {
        const events = [
            'lights_flicker',
            'strange_noise',
            'unexpected_visitor',
            'mystery_discount'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        EventManager.instance.emit('horror_event', {
            event: randomEvent,
            intensity: 0.5 + Math.random() * 0.5
        });
        
        console.log(`恐怖事件触发: ${randomEvent}`);
    }
    
    /**
     * 维修所有机器
     */
    private repairAllMachines(): void {
        for (const machine of this._activeMachines.values()) {
            if (machine.isBroken()) {
                machine.repair();
            }
        }
    }
    
    /**
     * 清理场景
     */
    private cleanupScene(): void {
        // 销毁所有顾客
        for (const customer of this._activeCustomers.values()) {
            customer.node.destroy();
        }
        this._activeCustomers.clear();
        
        // 销毁所有机器
        for (const machine of this._activeMachines.values()) {
            machine.node.destroy();
        }
        this._activeMachines.clear();
        
        console.log('主场景清理完成');
    }
    
    update(deltaTime: number) {
        if (!this._isSceneReady || GameManager.instance.getState() !== 'playing') {
            return;
        }
        
        // 更新游戏内时间
        this._dayTime += deltaTime;
        
        // 顾客生成计时
        this._customerSpawnTimer -= deltaTime;
        if (this._customerSpawnTimer <= 0) {
            this.spawnCustomer();
            this._customerSpawnTimer = this.customerSpawnInterval;
            
            // 微恐效果：夜晚生成更多恐怖顾客
            const isNight = (this._dayTime % 120) > 60;  // 假设2分钟一天，后1分钟是夜晚
            if (isNight && Math.random() < 0.4) {
                this.spawnScaryCustomer();
            }
        }
        
        // 更新UI时间显示
        this.updateTimeDisplay();
    }
    
    /**
     * 生成恐怖顾客
     */
    private spawnScaryCustomer(): void {
        // 专门生成恐怖类型的顾客
        if (this._activeCustomers.size >= this.maxCustomers) return;
        
        const customer = this.spawnCustomer();
        if (customer) {
            // 设置为恐怖类型
            customer.customerType = Math.random() < 0.5 ? 'scary' : 'ghost';
            
            // 恐怖顾客可能有特殊订单
            const scaryOrders = ['blood_latte', 'shadow_espresso', 'ghost_mocha'];
            customer.orderType = scaryOrders[Math.floor(Math.random() * scaryOrders.length)];
        }
    }
    
    /**
     * 更新时间显示
     */
    private updateTimeDisplay(): void {
        const totalSeconds = Math.floor(this._dayTime);
        const daySeconds = totalSeconds % 120;  // 2分钟一天
        const minutes = Math.floor(daySeconds / 60);
        const seconds = daySeconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 发送时间更新事件
        EventManager.instance.emit('time_update', {
            time: timeString,
            day: this._dayNumber,
            isDay: daySeconds <= 60,
            totalSeconds: totalSeconds
        });
    }
    
    /**
     * 获取当前金币
     */
    public getCoins(): number {
        return this._totalCoins;
    }
    
    /**
     * 获取当前分数
     */
    public getScore(): number {
        return this._totalScore;
    }
    
    /**
     * 获取当前天数
     */
    public getDayNumber(): number {
        return this._dayNumber;
    }
    
    /**
     * 获取当前时间
     */
    public getGameTime(): number {
        return this._dayTime;
    }
    
    /**
     * 获取活动顾客数量
     */
    public getCustomerCount(): number {
        return this._activeCustomers.size;
    }
    
    /**
     * 获取活动机器数量
     */
    public getMachineCount(): number {
        return this._activeMachines.size;
    }
    
    onDestroy() {
        this.cleanupScene();
        
        // 移除事件监听
        EventManager.instance.off(EventManager.Events.GAME_START, this.onGameStart, this);
        EventManager.instance.off(EventManager.Events.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.off(EventManager.Events.GAME_RESUMED, this.onGameResumed, this);
        EventManager.instance.off(EventManager.Events.GAME_END, this.onGameEnd, this);
        
        EventManager.instance.off(EventManager.Events.CUSTOMER_ARRIVED, this.onCustomerArrived, this);
        EventManager.instance.off(EventManager.Events.CUSTOMER_SERVED, this.onCustomerServed, this);
        EventManager.instance.off(EventManager.Events.CUSTOMER_LEFT, this.onCustomerLeft, this);
        EventManager.instance.off(EventManager.Events.CUSTOMER_ANGRY, this.onCustomerAngry, this);
        
        EventManager.instance.off(EventManager.Events.COFFEE_PRODUCED, this.onCoffeeProduced, this);
        EventManager.instance.off(EventManager.Events.COFFEE_SOLD, this.onCoffeeSold, this);
        
        EventManager.instance.off(EventManager.Events.COINS_CHANGED, this.onCoinsChanged, this);
        EventManager.instance.off(EventManager.Events.SCORE_CHANGED, this.onScoreChanged, this);
        
        EventManager.instance.off(EventManager.Events.AD_REWARD, this.onAdReward, this);
        
        EventManager.instance.off('customer_scared', this.onCustomerScared, this);
        EventManager.instance.off('coffee_machine_broken', this.onMachineBroken, this);
    }
}