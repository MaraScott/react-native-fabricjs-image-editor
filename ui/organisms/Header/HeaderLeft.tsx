
export interface HeaderLeftProps {
  key?: string;
  width: number;
  height: number;
}
    
export const HeaderLeft = (props: HeaderLeftProps) => {
  const { width, height } = props;
  return (
    <div key="header-left">
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
        Simple Canvas Editor
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
        Built with Konva and Atomic Design Pattern - {width}x{height}px canvas
        </p>
    </div>
  );
};
