// CLEAR Motion — 物理驱动的动效引擎
// Copyright (c) 2026 芜湖灵动亿创网络科技有限公司
// SPDX-License-Identifier: MIT
// https://github.com/overloadshop/CLEAR-Motion
// CLEAR Motion
class PhysicsEngine {
  constructor() {
    this.springs = new Map();
    this.entities = new Map();
    this.timeStep = 1000 / 60; // 60fps
    this.running = false;
  }

  // 创建物理实体
  createEntity(id, config = {}) {
    const entity = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      forces: { x: 0, y: 0 },
      physics: {
        mass: 1.0,
        restitution: 0.6,
        drag: 0.1,
        ...config.physics
      },
      transform: { scale: 1, rotation: 0 },
      ...config
    };
    this.entities.set(id, entity);
    return entity;
  }

  // 创建弹簧连接
  createSpring(id, pointA, pointB, config = {}) {
    const spring = {
      pointA,
      pointB,
      restLength: config.restLength || 100,
      stiffness: config.stiffness || 0.5,
      damping: config.damping || 0.3
    };
    this.springs.set(id, spring);
    return spring;
  }

  // 更新物理世界
  update(deltaTime) {
    if (!this.running) return;

    // 清除所有力
    this.clearForces();

    // 应用全局力（如重力）
    this.applyGlobalForces();

    // 更新弹簧
    this.updateSprings();

    // 积分运动
    this.integrateMotion(deltaTime);

    // 处理边界碰撞
    this.resolveBounds();
  }

  clearForces() {
    for (const entity of this.entities.values()) {
      entity.forces.x = 0;
      entity.forces.y = 0;
    }
  }

  applyGlobalForces() {
    // 示例：简单重力
    for (const entity of this.entities.values()) {
      entity.forces.y += entity.physics.mass * 0.5;
    }
  }

  updateSprings() {
    for (const spring of this.springs.values()) {
      const { pointA, pointB, restLength, stiffness, damping } = spring;
      
      // 计算方向向量
      const dx = pointB.position.x - pointA.position.x;
      const dy = pointB.position.y - pointA.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 计算弹簧力 (胡克定律)
      const displacement = distance - restLength;
      const springForce = stiffness * displacement;
      
      // 计算阻尼力
      const relativeVelocityX = pointB.velocity.x - pointA.velocity.x;
      const relativeVelocityY = pointB.velocity.y - pointA.velocity.y;
      const dampingForceX = damping * relativeVelocityX;
      const dampingForceY = damping * relativeVelocityY;
      
      // 应用力
      if (distance > 0) {
        const forceX = (dx / distance) * (springForce + dampingForceX);
        const forceY = (dy / distance) * (springForce + dampingForceY);
        
        pointA.forces.x += forceX;
        pointA.forces.y += forceY;
        pointB.forces.x -= forceX;
        pointB.forces.y -= forceY;
      }
    }
  }

  integrateMotion(deltaTime) {
    const sec = deltaTime / 1000;
    
    for (const entity of this.entities.values()) {
      // 计算加速度 (F=ma)
      const ax = entity.forces.x / entity.physics.mass;
      const ay = entity.forces.y / entity.physics.mass;
      
      // 更新速度 (欧拉积分)
      entity.velocity.x += ax * sec;
      entity.velocity.y += ay * sec;
      
      // 应用阻力
      entity.velocity.x *= (1 - entity.physics.drag);
      entity.velocity.y *= (1 - entity.physics.drag);
      
      // 更新位置
      entity.position.x += entity.velocity.x * sec;
      entity.position.y += entity.velocity.y * sec;
    }
  }

  resolveBounds() {
    // 示例：简单的底部边界碰撞
    const bottomBound = 500;
    
    for (const entity of this.entities.values()) {
      if (entity.position.y > bottomBound) {
        entity.position.y = bottomBound;
        entity.velocity.y = -entity.velocity.y * entity.physics.restitution;
      }
    }
  }

  start() {
    this.running = true;
    let lastTime = performance.now();
    
    const loop = (currentTime) => {
      if (!this.running) return;
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.update(deltaTime);
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }
}

// 界面滚动物li
class ScrollSimulator {
    constructor(options = {}) {
        this.position = 0;
        this.velocity = 0;
        this.min = 0;
        this.max = 0;
        this.friction = 0.95; // 动量摩擦力
        this.springStiffness = 0.15; // 橡皮筋刚度 (越界时的拉力)
        this.springDamping = 0.8; // 橡皮筋阻尼
        this.isDragging = false;
        this.animationId = null;
        this.lastTime = 0;
        
        this.onUpdate = options.onUpdate || (() => {});
        this.onScrollEnd = options.onScrollEnd || (() => {});
    }

    start(position) {
        this.isDragging = true;
        this.position = position;
        this.velocity = 0;
        this.cancelAnimation();
    }

    move(delta) {
        if (!this.isDragging) return;
        
        let newPos = this.position + delta;
        
        // 越界时的橡皮筋阻力
        if (newPos < this.min) {
            const overscroll = this.min - newPos;
            // 施加阻力：减弱位移增量的影响
            newPos = this.position + delta * 0.4; 
        } else if (newPos > this.max) {
            newPos = this.position + delta * 0.4;
        }
        
        this.position = newPos;
        this.onUpdate(this.position);
    }

    end(velocity) {
        this.isDragging = false;
        this.velocity = velocity;
        this.startAnimation();
    }
    
    startAnimation() {
        let lastTime = performance.now();
        
        const step = () => {
            if (this.isDragging) return;
            
            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05); // 限制最大时间步长为 50ms
            lastTime = now;
            
            // 1. 摩擦力 (减速过程)
            // 将摩擦力应用到速度上
            this.velocity *= Math.pow(this.friction, dt * 60);
            
            // 2. 弹簧物理 (橡皮筋回弹效果)
            let force = 0;
            let isOutOfBounds = false;
            
            if (this.position < this.min) {
                isOutOfBounds = true;
                const dist = this.min - this.position;
                // 弹簧力：F = k * x
                force = dist * this.springStiffness * 60;
                // 将力施加到速度上
                this.velocity += force * dt;
                // 应用弹簧阻尼
                this.velocity *= this.springDamping;
            } else if (this.position > this.max) {
                isOutOfBounds = true;
                const dist = this.max - this.position;
                force = dist * this.springStiffness * 60;
                this.velocity += force * dt;
                this.velocity *= this.springDamping;
            }
            
            // 3. 更新位置
            this.position += this.velocity * dt * 60;
            
            // 4. 停止条件
            // 当速度极低，并且（在边界内，或者非常接近边界）时停止
            if (Math.abs(this.velocity) < 0.5 && (!isOutOfBounds || Math.abs(this.position - (this.position < this.min ? this.min : this.max)) < 0.5)) {
                // 吸附到边界
                if (this.position < this.min) this.position = this.min;
                if (this.position > this.max) this.position = this.max;
                this.onUpdate(this.position);
                this.onScrollEnd();
                this.animationId = null;
                return;
            }
            
            this.onUpdate(this.position);
            this.animationId = requestAnimationFrame(step);
        };
        this.animationId = requestAnimationFrame(step);
    }
    
    cancelAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// 1D Spring Animator with Advanced Physics (Gravity, Mass, Roughness) / 带有高级物理特性(重力、质量、粗糙度)的1D弹簧动画器
class SpringAnimator {
    constructor(initialValue = 0, config = {}) {
        this.value = initialValue;
        this.target = initialValue;
        this.velocity = 0;
        
        // 核心弹簧参数
        this.stiffness = config.stiffness || 170; // 弹力刚度
        this.damping = config.damping || 26;      // 弹簧阻尼
        
        // 物理材质参数
        this.mass = config.mass || 1.0;           // 质量：越大惯性越大，加速/减速越慢
        this.gravity = config.gravity || 0;       // 重力加速度：持续施加的恒定力 (可以有方向)
        this.roughness = config.roughness !== undefined ? config.roughness : 0.05; // 表面粗糙度/摩擦系数：影响滑动时的动能损耗
        this.airResistance = config.airResistance !== undefined ? config.airResistance : 0.01; // 空气阻力：与速度平方成正比的损耗
        
        // 更严格的停止阈值，实现“无限削弱”的视觉效果，直到极其微小的颤动结束
        this.restThreshold = config.restThreshold || 0.0001; 
        this.restVelocityThreshold = config.restVelocityThreshold || 0.0001;
        
        this.running = false;
        this.onUpdate = config.onUpdate || (() => {});
        this.onComplete = config.onComplete || null;
        this.animationId = null;
    }

    setTarget(target, delay = 0) {
        if (delay > 0) {
            if (this.delayTimeout) clearTimeout(this.delayTimeout);
            this.delayTimeout = setTimeout(() => {
                this.target = target;
                if (!this.running) this.start();
            }, delay);
        } else {
            if (this.delayTimeout) clearTimeout(this.delayTimeout);
            this.target = target;
            if (!this.running) {
                this.start();
            }
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        let lastTime = performance.now();
        
        const step = (currentTime) => {
            if (!this.running) return;
            
            const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // 限制时间步长最大为50ms
            lastTime = currentTime;
            
            // 综合受力计算
            // 1. 弹簧力 (向目标点拉伸)
            const displacement = this.value - this.target;
            const springForce = -this.stiffness * displacement;
            
            // 2. 弹簧内部阻尼力 (与速度成正比，方向相反)
            const dampingForce = -this.damping * this.velocity;
            
            // 3. 恒定重力 (如果设置了的话，产生持续的单向偏置)
            const gravityForce = this.mass * this.gravity;
            
            // 4. 空气阻力 (与速度的平方成正比，速度越快阻力成倍增加)
            const airDragForce = -Math.sign(this.velocity) * this.airResistance * (this.velocity * this.velocity);
            
            // 计算总力 F = F_spring + F_damping + F_gravity + F_air
            const force = springForce + dampingForce + gravityForce + airDragForce;
            
            // a = F / m (质量越大，加速度越小，惯性表现越强)
            const acceleration = force / this.mass;
            
            // 积分更新速度 (半隐式欧拉积分 Semi-implicit Euler)
            this.velocity += acceleration * dt;
            
            // 5. 表面粗糙度导致的动能摩擦损耗 (与重力正交，模拟物理表面的滑动摩擦)
            // 随着每一帧时间的流逝，按比例扣除速度
            this.velocity *= (1 - this.roughness * dt);
            
            // 积分更新位置
            this.value += this.velocity * dt;
            
            this.onUpdate(this.value);
            
            // 极其严苛的停止条件，确保看到最后哪怕是 0.1px 的微小颤动
            if (Math.abs(this.velocity) < this.restVelocityThreshold && Math.abs(this.value - this.target) < this.restThreshold) {
                this.value = this.target;
                this.velocity = 0;
                this.onUpdate(this.value);
                this.running = false;
                this.animationId = null;
                if (this.onComplete) this.onComplete();
                return;
            }
            
            this.animationId = requestAnimationFrame(step);
        };
        
        this.animationId = requestAnimationFrame(step);
    }
    
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// 附加到物理引擎对象
PhysicsEngine.SpringAnimator = SpringAnimator;
PhysicsEngine.ScrollSimulator = ScrollSimulator;

// 导出单例实例
const physics = new PhysicsEngine();
physics.ScrollSimulator = ScrollSimulator;
physics.SpringAnimator = SpringAnimator;

// 暴露给全局 System 对象以便 API 访问
if (typeof window !== 'undefined') {
    window.System = window.System || {};
    window.System.Physics = physics;
    // 直接挂载到 window 方便普通 HTML 引入调用
    window.SpringAnimator = SpringAnimator;
}
