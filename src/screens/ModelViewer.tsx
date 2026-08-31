import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {
  DRACO_DECODER_PATH,
  FIGURES,
  MODEL_HEIGHT_METERS,
} from '../data/models';
import { selectAllGroupsComplete, useGameStore } from '../state/gameStore';

const PICKER_OFFSET_PX = 100;

function meshBounds(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let hasMesh = false;
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      box.expandByObject(object);
      hasMesh = true;
    }
  });
  return hasMesh ? box : new THREE.Box3().setFromObject(root);
}

function standOnOrigin(root: THREE.Object3D, targetHeight: number) {
  const first = meshBounds(root);
  const size = new THREE.Vector3();
  first.getSize(size);
  const height = size.y > 0 ? size.y : 1;
  root.scale.multiplyScalar(targetHeight / height);

  const box = meshBounds(root);
  root.position.x -= (box.min.x + box.max.x) / 2;
  root.position.z -= (box.min.z + box.max.z) / 2;
  root.position.y -= box.min.y;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) material.dispose();
    }
  });
}

export default function ModelViewer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const allGroupsComplete = useGameStore(selectAllGroupsComplete);

  const hostRef = useRef<HTMLDivElement>(null);
  const loadFigureRef = useRef<(url: string) => void>(() => undefined);
  const applyThemeRef = useRef<(index: number) => void>(() => undefined);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const selected = FIGURES[selectedIndex];

  useEffect(() => {
    if (!allGroupsComplete) navigate('/menu', { replace: true });
  }, [allGroupsComplete, navigate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const background = new THREE.Color(FIGURES[0].background);
    scene.background = background;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff4ee, 0x4a3040, 1.15));

    const key = new THREE.DirectionalLight(0xfff6ee, 1.35);
    key.position.set(0.18, 0.28, 0.22);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    fill.position.set(-0.2, 0.12, -0.1);
    scene.add(fill);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: FIGURES[0].ground,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(0.08, 48), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const applyTheme = (index: number) => {
      const figure = FIGURES[index];
      background.setHex(figure.background);
      groundMaterial.color.setHex(figure.ground);
      host.style.backgroundColor = `#${figure.background.toString(16).padStart(6, '0')}`;
    };
    applyTheme(0);
    applyThemeRef.current = applyTheme;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 0.08;
    controls.maxDistance = 0.55;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.4;

    const frameCamera = (focus?: THREE.Object3D) => {
      const box = focus
        ? meshBounds(focus)
        : new THREE.Box3(
            new THREE.Vector3(-0.04, 0, -0.04),
            new THREE.Vector3(0.04, MODEL_HEIGHT_METERS, 0.04),
          );
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const span = Math.max(size.x, size.y, size.z, MODEL_HEIGHT_METERS);
      const fov = (camera.fov * Math.PI) / 180;
      const distance = ((span / 2) / Math.tan(fov / 2)) * 2.0;
      camera.position.set(
        center.x + distance * 0.18,
        center.y + size.y * 0.16,
        center.z + distance,
      );
      controls.target.set(center.x, center.y + size.y * 0.12, center.z);
      controls.update();
    };
    frameCamera();

    const resize = () => {
      const width = host.clientWidth;
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.setViewOffset(width, height, 0, height * 0.1, width, height);
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    draco.preload();

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    let cancelled = false;
    let current: THREE.Object3D | null = null;
    let pendingUrl = '';

    const loadFigure = (url: string) => {
      pendingUrl = url;
      setStatus('loading');
      loader.load(
        url,
        (gltf) => {
          if (cancelled || pendingUrl !== url) {
            disposeObject(gltf.scene);
            return;
          }
          if (current) {
            scene.remove(current);
            disposeObject(current);
          }
          const root = gltf.scene;
          standOnOrigin(root, MODEL_HEIGHT_METERS);
          scene.add(root);
          current = root;
          frameCamera(root);
          setStatus('ready');
        },
        undefined,
        () => {
          if (!cancelled && pendingUrl === url) setStatus('error');
        },
      );
    };

    loadFigureRef.current = loadFigure;

    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelled = true;
      loadFigureRef.current = () => undefined;
      applyThemeRef.current = () => undefined;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      draco.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (current) disposeObject(current);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    applyThemeRef.current(selectedIndex);
    loadFigureRef.current(FIGURES[selectedIndex].url);
  }, [selectedIndex]);

  return (
    <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden">
      <div ref={hostRef} className="absolute inset-0" />
      {status === 'loading' ? (
        <p
          className={`pointer-events-none absolute inset-0 grid place-items-center text-sm ${
            selected.light ? 'text-[#3a1520]/75' : 'text-[#fbe9ee]/80'
          }`}
        >
          {t('model.loading')}
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="absolute inset-x-3 top-20 z-10 rounded-xl bg-bad-bg px-3.5 py-2.5 text-[12.5px] leading-snug text-[#5c1416]">
          {t('model.error')}
        </p>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex h-[96px] items-center justify-center overflow-hidden">
        {FIGURES.map((figure, index) => {
          const isSelected = index === selectedIndex;
          const visible = Math.abs(index - selectedIndex) <= 1;
          const shift = (index - selectedIndex) * PICKER_OFFSET_PX;
          return (
            <button
              key={figure.id}
              type="button"
              aria-label={t(figure.labelKey)}
              aria-pressed={isSelected}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              onClick={() => {
                if (visible && index !== selectedIndex) setSelectedIndex(index);
              }}
              className={`absolute top-1/2 left-1/2 overflow-hidden rounded-full border-2 bg-transparent p-0 transition-[transform,width,height,opacity,border-color] duration-300 ease-out ${
                visible ? 'pointer-events-auto' : 'pointer-events-none'
              } ${
                isSelected
                  ? 'h-[83.16px] w-[83.16px] border-white/90 opacity-100'
                  : `h-[69.3px] w-[69.3px] border-white/55 ${visible ? 'opacity-80' : 'opacity-0'}`
              }`}
              style={{ transform: `translate(-50%, -50%) translateX(${shift}px)` }}
            >
              <img
                src={figure.icon}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
