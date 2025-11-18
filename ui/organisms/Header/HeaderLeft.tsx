
export interface HeaderLeftProps {
  key?: string;
  width: number;
  height: number;
}
    
export const HeaderLeft = (props: HeaderLeftProps) => {
  const { width, height } = props;
  return (
    <div>
        <h1 key={`header-left-title`}>
        TinyArtist Editor
        </h1>
        <p key={`header-left-tag-line`}>
        Let's DreamDraw - {width}x{height}px canvas
        </p>
    </div>
  );
};
