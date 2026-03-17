/**
 * UI 基础组件 v2.0
 * 提供标准化的 UI 组件基类
 */


import { _decorator, Component, Node, UITransform, Vec3, Color } from 'cc';


const { ccclass } = _decorator;



@ccclass('BaseUIComponent')
export class BaseUIComponent extends Component {
  // 动画配置
  protected _animConfig = {
    duration: 0.3,
    easing: 'quadOut'
  };


  // 显示
  public show(): void {
    this.node.active = true;
    this.playShowAnim();
  }



  // 隐藏
  public hide(): void {
    this.playHideAnim();
    this.node.active = false;
  }


  // 显示动画
  protected playShowAnim(): void {
    // 缩放进入    const scale = Vec3.ONE;
    this.node.setScale(Vec3.ZERO);
    // Tween 动画实现 (简化为直接设置
    this.node.setScale(scale);
  }

  // 隐藏动画
  protected playHideAnim(): void {
    this.node.setScale(Vec3.ZERO);
  }
}