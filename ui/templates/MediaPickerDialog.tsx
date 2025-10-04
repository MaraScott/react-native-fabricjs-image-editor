import { Button, Dialog, Image, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { EnhancedIcon } from '@atoms/icons/EnhancedIcons';
import type { NormalizedMediaItem } from '@hooks/editor/useWordPressIntegration';

export interface MediaPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    media: NormalizedMediaItem[];
    isLoading: boolean;
    error: string | null;
    onSelectMedia: (item: NormalizedMediaItem) => void;
    onRefresh: () => void;
    iconSize?: number;
}

export function MediaPickerDialog({
    open,
    onOpenChange,
    media,
    isLoading,
    error,
    onSelectMedia,
    onRefresh,
    iconSize = 16,
}: MediaPickerDialogProps) {
    return (
        <Dialog modal open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Dialog.Content
                    bordered
                    elevate
                    key="content"
                    animateOnly={['transform', 'opacity']}
                    animation={[
                        'quick',
                        {
                            opacity: {
                                overshootClamping: true,
                            },
                        },
                    ]}
                    enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                    exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                    gap="$4"
                    maxWidth={600}
                    maxHeight="80vh"
                >
                    <Dialog.Title>Select Media</Dialog.Title>
                    <Dialog.Description>Choose an image from your media library</Dialog.Description>

                    {error && (
                        <YStack padding="$3" backgroundColor="$red3" borderRadius="$2">
                            <Text color="$red11">{error}</Text>
                        </YStack>
                    )}

                    <XStack gap="$2" justifyContent="flex-end">
                        <Button
                            size="$3"
                            onPress={onRefresh}
                            disabled={isLoading}
                            icon={<EnhancedIcon name="refresh" size={iconSize} theme="kid" />}
                        >
                            Refresh
                        </Button>
                    </XStack>

                    <ScrollView maxHeight={400}>
                        {isLoading ? (
                            <YStack padding="$4" alignItems="center">
                                <Text>Loading media...</Text>
                            </YStack>
                        ) : media.length === 0 ? (
                            <YStack padding="$4" alignItems="center">
                                <Paragraph>No media found</Paragraph>
                            </YStack>
                        ) : (
                            <XStack flexWrap="wrap" gap="$2" padding="$2">
                                {media.map((item) => (
                                    <YStack
                                        key={item.id}
                                        width={120}
                                        gap="$1"
                                        padding="$2"
                                        borderRadius="$2"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        pressStyle={{ backgroundColor: '$backgroundPress' }}
                                        cursor="pointer"
                                        onPress={() => {
                                            onSelectMedia(item);
                                            onOpenChange(false);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: item.previewUrl }}
                                            width={104}
                                            height={104}
                                            objectFit="cover"
                                            borderRadius="$1"
                                        />
                                        <Text fontSize="$2" numberOfLines={2} ellipsizeMode="tail">
                                            {item.title}
                                        </Text>
                                    </YStack>
                                ))}
                            </XStack>
                        )}
                    </ScrollView>

                    <XStack gap="$3" justifyContent="flex-end">
                        <Dialog.Close displayWhenAdapted asChild>
                            <Button>Close</Button>
                        </Dialog.Close>
                    </XStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}
