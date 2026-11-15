# CLEAR Motion

物理驱动的动效引擎，浏览器里的轻量实现。零依赖，一个 `PhysicsEngine.js` 放进页面即可。

它不是给关键帧补间用的：运动由弹簧、阻尼、重力、空气阻力实时积分出来，
所以随时改目标、随时打断，画面都会自然地接下去——这正是「跟手」和「可打断」的基础。

## 三个模块

| 模块 | 用途 |
| --- | --- |
| `PhysicsEngine` | 二维实体与弹簧连接，适合粒子、布料、弹簧网络 |
| `ScrollSimulator` | 一维滚动：拖拽跟随、松手惯性、越界回弹 |
| `SpringAnimator` | 任意数值沿弹簧曲线过渡，适合位移、透明度、弹性跟随 |

三者互相独立，可以同时创建任意多个实例。

## 使用

```html
<script src="src/PhysicsEngine.js"></script>
<script>
  // 弹簧动画：0 → 1
  const anim = new SpringAnimator(0, {
    stiffness: 320,   // 刚度，越大越快
    damping: 22,      // 阻尼，越大越不振荡
    mass: 1,          // 质量，越大惯性越强
    roughness: 0.05,  // 表面摩擦
    airResistance: 0.01, // 空气阻力
    onUpdate: value => { /* 每帧回调 */ }
  });
  anim.setTarget(1);

  // 物理世界
  const a = System.Physics.createEntity('a', { position: { x: 0, y: 0 } });
  const b = System.Physics.createEntity('b', { position: { x: 120, y: 0 } });
  System.Physics.createSpring('s', a, b, { restLength: 80, stiffness: 0.5, damping: 0.3 });
  System.Physics.start();
</script>
```

完整的参数说明和演示见 [`examples/spring.html`](examples/spring.html)（直接用浏览器打开）。

## 参数速查

`SpringAnimator` 的构造参数决定手感：

| 参数 | 默认 | 作用 |
| --- | --- | --- |
| `stiffness` | 170 | 刚度，越大回弹越快 |
| `damping` | 26 | 阻尼，越大越不振荡 |
| `mass` | 1.0 | 质量，越大加速/减速越慢 |
| `gravity` | 0 | 恒定重力，可产生单向偏置 |
| `roughness` | 0.05 | 表面摩擦，影响动能损耗 |
| `airResistance` | 0.01 | 空气阻力，与速度平方成正比 |

积分使用半隐式欧拉，每帧步长上限 50ms，掉帧时不会炸开。

## 浏览器兼容

任一支持 `requestAnimationFrame` 的现代浏览器。没有构建步骤，没有依赖。

## 许可

[MIT](LICENSE)。原生版本（C++ / 预编译库）是独立的 CLEAR Motion Pro，采用另一套许可。
