'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CompanyMap3DProps {
  onClose: () => void;
  studentPersonalityType: string | null;
  companies: Array<{
    id: string;
    name: string;
    personality_type: string | null;
    company_vision?: string | null;
  }>;
}

export function CompanyMap3D({ onClose, studentPersonalityType, companies }: CompanyMap3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // カメラの状態を保持するためのref
  const cameraStateRef = useRef<{
    yaw: number;
    pitch: number;
    currentStudentPosition: THREE.Vector3 | null;
  }>({
    yaw: 0,
    pitch: 0,
    currentStudentPosition: null
  });

  // パーソナリティタイプを数値に変換（簡易版）
  const personalityTypeToPosition = (type: string | null): THREE.Vector3 => {
    if (!type) return new THREE.Vector3(0, 0, 0);
    
    // タイプコードから数値を生成（例: ENPF -> E=1, N=1, F=1, P=1）
    const eValue = type.includes('E') ? 1 : -1;
    const nValue = type.includes('N') ? 1 : -1;
    const fValue = type.includes('F') ? 1 : -1;
    const pValue = type.includes('P') ? 1 : -1;
    
    // 3D空間に配置（X: E/I, Y: F/T, Z: N/S）
    // 距離を離すためにスケールを10倍に（企業間の距離を確保）
    const scale = 10;
    return new THREE.Vector3(eValue * scale, fValue * scale, nValue * scale);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // シーンの作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 空色
    sceneRef.current = scene;

    // カメラの作成（ファーストパーソン視点）
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    // 学生アバターの位置を計算
    const studentPosition = personalityTypeToPosition(studentPersonalityType);
    
    // カメラの作成（ファーストパーソン視点 - 目の高さに配置）
    camera.position.set(studentPosition.x, 1.6, studentPosition.z); // 目の高さ（約1.6m、地面から）
    camera.rotation.set(0, 0, 0); // 水平方向を向く
    cameraRef.current = camera;

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 地面の作成（距離に合わせて拡大）
    const groundSize = 100; // 企業間の距離が広がったので、地面も拡大
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x90EE90,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // グリッドの追加（距離に合わせて拡大）
    const gridHelper = new THREE.GridHelper(groundSize, groundSize, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // 学生アバター（人型の簡易表現）
    const studentGroup = new THREE.Group();
    
    // 体（円柱）
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    studentGroup.add(body);

    // 頭（球）
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.0;
    head.castShadow = true;
    studentGroup.add(head);

    // 足（歩行アニメーション用）
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2E5090 });
    
    // 左足
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, -0.2, 0);
    leftLeg.castShadow = true;
    studentGroup.add(leftLeg);
    
    // 右足
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, -0.2, 0);
    rightLeg.castShadow = true;
    studentGroup.add(rightLeg);
    
    // 歩行アニメーション用の変数
    let walkAnimationTime = 0;

    studentGroup.position.copy(studentPosition);
    studentGroup.position.y = 0.4; // 地面に足をつける（体の中心が0.4なので、足が地面に接する）
    scene.add(studentGroup);

    // レイキャスター（クリック検出用）
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const buildingGroups: THREE.Group[] = [];

    // 同じタイプの企業をグループ化して、位置をずらす
    const companiesByType = new Map<string, number>();
    
    // 企業の建物を作成
    companies.forEach((company, index) => {
      if (!company.personality_type) return;

      const basePosition = personalityTypeToPosition(company.personality_type);
      
      // 同じタイプの企業が何番目かをカウント
      const typeCount = companiesByType.get(company.personality_type) || 0;
      companiesByType.set(company.personality_type, typeCount + 1);
      
      // 同じタイプの企業が複数ある場合、円形に配置
      // 企業間の距離を5以上にするため、オフセットの半径を大きくする
      const offsetRadius = 5.0; // オフセットの半径（企業間の距離を広げる、最小5）
      const angle = (typeCount * 2 * Math.PI) / (companies.filter(c => c.personality_type === company.personality_type).length || 1);
      const offsetX = Math.cos(angle) * offsetRadius;
      const offsetZ = Math.sin(angle) * offsetRadius;
      
      const companyPosition = new THREE.Vector3(
        basePosition.x + offsetX,
        basePosition.y,
        basePosition.z + offsetZ
      );
      
      const buildingGroup = new THREE.Group();

      // 建物（箱）
      const buildingGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const buildingMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(index * 0.1, 0.7, 0.5)
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.y = 0.5; // 建物の中心が0.5（高さ1なので、0.0〜1.0）
      building.castShadow = true;
      building.receiveShadow = true;
      buildingGroup.add(building);

      // 建物の上にラベル（目指す未来を表示）
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        // ラベルのサイズを大きくして、長いテキストに対応
        canvas.width = 512;
        canvas.height = 128;
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 目指す未来を表示（なければ企業名）
        const displayText = company.company_vision || company.name || '企業情報';
        // テキストを折り返して表示（最大2行）
        const maxWidth = canvas.width - 20;
        const words = displayText.split('');
        let line = '';
        let y = canvas.height / 2 - 15;
        const lineHeight = 25;
        let lineCount = 0;
        
        for (let i = 0; i < words.length && lineCount < 2; i++) {
          const testLine = line + words[i];
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && line.length > 0) {
            context.fillText(line, canvas.width / 2, y);
            line = words[i];
            y += lineHeight;
            lineCount++;
          } else {
            line = testLine;
          }
        }
        if (line.length > 0 && lineCount < 2) {
          context.fillText(line, canvas.width / 2, y);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 1.5, 0);
        sprite.scale.set(4, 1, 1); // ラベルを大きく表示
        buildingGroup.add(sprite);
      }

      buildingGroup.position.copy(companyPosition);
      buildingGroup.position.y = 0; // 地面に接する（建物の下端が0になる）
      scene.add(buildingGroup);
      
      // クリック検出用に配列に追加
      buildingGroups.push(buildingGroup);
    });

    // ファーストパーソン視点のコントロール
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // カメラの状態を初期化（既存の状態があれば使用、なければ初期値）
    let yaw = cameraStateRef.current.yaw;
    let pitch = cameraStateRef.current.pitch;
    let currentStudentPosition: THREE.Vector3;
    
    if (cameraStateRef.current.currentStudentPosition) {
      // 既存の状態があれば使用
      currentStudentPosition = cameraStateRef.current.currentStudentPosition;
    } else {
      // 初回のみ初期位置を設定
      currentStudentPosition = new THREE.Vector3(
        studentPosition.x,
        1.6, // 目の高さ（地面から1.6m）
        studentPosition.z
      );
      cameraStateRef.current.currentStudentPosition = currentStudentPosition;
    }
    
    const moveSpeed = 0.1;
    const keys: { [key: string]: boolean } = {};

    const onMouseDown = (e: MouseEvent) => {
      // 通常通りドラッグを開始
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // マウスの動きに応じて視点を回転
      yaw -= deltaX * 0.002;
      pitch -= deltaY * 0.002;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // 上下の回転を制限
      
      // 状態を保存
      cameraStateRef.current.yaw = yaw;
      cameraStateRef.current.pitch = pitch;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // ズーム機能は無効化（ファーストパーソン視点では不要）
    };

    // キーボード入力
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    // 移動処理
    const updateMovement = () => {
      const direction = new THREE.Vector3();
      
      if (keys['w']) direction.z -= 1;
      if (keys['s']) direction.z += 1;
      if (keys['a']) direction.x -= 1;
      if (keys['d']) direction.x += 1;

      if (direction.length() > 0) {
        direction.normalize();
        
        // カメラの向きに応じて移動方向を回転
        const yawRotation = new THREE.Matrix4().makeRotationY(yaw);
        direction.applyMatrix4(yawRotation);
        
        // 移動
        currentStudentPosition.add(direction.multiplyScalar(moveSpeed));
        currentStudentPosition.y = 1.6; // Y座標は固定（目の高さ）
        
        // 歩行アニメーションを更新
        walkAnimationTime += 0.2;
        
        // 状態を保存
        cameraStateRef.current.currentStudentPosition = currentStudentPosition;
      } else {
        // 停止時は歩行アニメーションをリセット
        walkAnimationTime = 0;
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // アニメーションループ
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // 移動処理
      updateMovement();
      
      // カメラの位置と回転を更新（視点を固定）
      camera.position.copy(currentStudentPosition);
      camera.rotation.set(pitch, yaw, 0);
      
      // 状態を保存（アニメーションループ内でも更新）
      cameraStateRef.current.yaw = yaw;
      cameraStateRef.current.pitch = pitch;
      cameraStateRef.current.currentStudentPosition = currentStudentPosition;
      
      // 学生アバターの位置も更新（可視化のため）
      // 体の下端が0になるように配置（体の中心が0.4なので、位置は0）
      studentGroup.position.set(
        currentStudentPosition.x,
        0, // 地面に足をつける
        currentStudentPosition.z
      );
      studentGroup.rotation.y = yaw + Math.PI; // カメラの向きに合わせて回転
      
      // 歩行アニメーション（足の動きを模擬）
      const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'];
      if (isMoving) {
        // 左右の足を交互に動かす（歩行の模擬）
        const legSwing = Math.sin(walkAnimationTime) * 0.3; // 足の振り幅
        const legLift = Math.max(0, Math.sin(walkAnimationTime)) * 0.1; // 足の上げ幅
        
        // 左足と右足を交互に動かす
        leftLeg.rotation.x = Math.sin(walkAnimationTime) * 0.5;
        leftLeg.position.y = -0.2 + (Math.sin(walkAnimationTime) > 0 ? legLift : 0);
        rightLeg.rotation.x = -Math.sin(walkAnimationTime) * 0.5;
        rightLeg.position.y = -0.2 + (Math.sin(walkAnimationTime) < 0 ? legLift : 0);
      } else {
        // 停止時は足を元の位置に戻す
        leftLeg.rotation.x = 0;
        leftLeg.position.y = -0.2;
        rightLeg.rotation.x = 0;
        rightLeg.position.y = -0.2;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    setIsLoading(false);

    // クリーンアップ
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [studentPersonalityType, companies]);

  // ウィンドウリサイズ対応
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white/90 backdrop-blur-sm p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">3Dマップ</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>

      {/* 3Dキャンバス */}
      <div 
        ref={mountRef} 
        className="flex-1 w-full"
        style={{ minHeight: 0 }}
      />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl">読み込み中...</div>
        </div>
      )}

      {/* 操作説明 */}
      <div className="bg-white/90 backdrop-blur-sm p-4 text-sm text-gray-700">
        <p>操作: マウスドラッグで視点を回転、WASDキーで移動</p>
      </div>
    </div>
  );
}

